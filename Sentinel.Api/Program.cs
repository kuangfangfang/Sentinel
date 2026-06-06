using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Sentinel.Api.Authorization;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;
using Sentinel.Core;
using Sentinel.Core.Services;
using Sentinel.Data;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/sentinel-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14));

    var configuration = builder.Configuration;

    // ----- Database: SQLite locally, SQL Server (Azure SQL) in production. LINQ is identical. -----
    var dbProvider = configuration["DatabaseProvider"] ?? "Sqlite";
    builder.Services.AddDbContext<SentinelDbContext>(options =>
    {
        if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
            options.UseSqlServer(configuration.GetConnectionString("SqlServer"));
        else
            options.UseSqlite(configuration.GetConnectionString("Sqlite") ?? "Data Source=sentinel.db");
    });

    // ----- Identity: password policy (FR-12) and account lockout (FR-9). -----
    builder.Services
        .AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequiredLength = 10;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;

            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.AllowedForNewUsers = true;

            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedAccount = false;
        })
        .AddRoles<IdentityRole<Guid>>()
        .AddEntityFrameworkStores<SentinelDbContext>()
        .AddSignInManager()
        .AddDefaultTokenProviders();

    // ----- JWT bearer authentication (Path B: API and SPA are separate origins, guide §3). -----
    var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
    if (string.IsNullOrWhiteSpace(jwtSettings.SigningKey))
    {
        if (builder.Environment.IsDevelopment())
        {
            jwtSettings.SigningKey = "DEV-ONLY-INSECURE-SIGNING-KEY-do-not-use-in-production-0123456789";
            Log.Warning("Jwt:SigningKey is not configured. Using an insecure development key. " +
                        "Set Jwt__SigningKey (env var / user-secrets) for any real deployment.");
        }
        else
        {
            throw new InvalidOperationException("Jwt:SigningKey must be configured outside Development.");
        }
    }
    builder.Services.AddSingleton(jwtSettings);

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false; // keep claim types exactly as issued
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey)),
                NameClaimType = "name",
                RoleClaimType = ClaimTypes.Role,
                ClockSkew = TimeSpan.FromSeconds(30),
            };
        });

    builder.Services.AddAuthorizationBuilder()
        .AddPolicy(Policies.ComplainantOnly, p => p.RequireRole(Roles.Complainant))
        .AddPolicy(Policies.CaseworkerOnly, p => p.RequireRole(Roles.Caseworker));

    // ----- CORS: allow only the configured frontend origins (guide §3.5). -----
    var corsOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173" };
    const string CorsPolicy = "SentinelFrontend";
    builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));

    // ----- Controllers + JSON (enums as strings, so the TS frontend uses string unions). -----
    builder.Services
        .AddControllers()
        .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

    // We check ModelState manually (guide §4.2) and allow lenient draft saves, so the
    // automatic 400 filter is suppressed.
    builder.Services.Configure<ApiBehaviorOptions>(o => o.SuppressModelStateInvalidFilter = true);

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Sentinel API", Version = "v1" });
        var scheme = new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste the JWT returned by /api/auth/login.",
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        };
        c.AddSecurityDefinition("Bearer", scheme);
        c.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
    });

    // ----- Cross-cutting + application services. -----
    builder.Services.AddHttpContextAccessor();
    var fileOptions = configuration.GetSection("FileStorage").Get<FileStorageOptions>() ?? new FileStorageOptions();
    builder.Services.AddSingleton(fileOptions);
    builder.Services.Configure<AbrLookupOptions>(configuration.GetSection("AbrLookup"));

    builder.Services.AddSingleton<IReferenceCodeGenerator, ReferenceCodeGenerator>();
    builder.Services.AddSingleton<IStatusTransitionService, StatusTransitionService>();
    builder.Services.AddSingleton<ITriageService, TriageService>();
    builder.Services.AddSingleton<IVirusScanner, StubVirusScanner>();
    builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
    builder.Services.AddSingleton<ITokenService, JwtTokenService>();
    builder.Services.AddHttpClient<AbrLookupService>();
    builder.Services.AddScoped<ICurrentUser, CurrentUser>();
    builder.Services.AddScoped<IAuditService, AuditService>();
    builder.Services.AddScoped<ComplaintService>();
    builder.Services.AddScoped<CaseworkerService>();
    builder.Services.AddScoped<TrackingService>();

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<SentinelDbContext>("database");

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
    });

    var app = builder.Build();

    // ----- Pipeline. Exception handling is first so it wraps everything (SRS 7.2). -----
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseForwardedHeaders();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    else
    {
        app.UseHttpsRedirection(); // force HTTPS in production (SRS 6.4, AC)
    }

    app.UseCors(CorsPolicy);
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Name == "database",
    });
    app.MapControllers();

    // ----- Apply migrations and seed clearly-fictional demo data on startup. -----
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var db = services.GetRequiredService<SentinelDbContext>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var seedOptions = configuration.GetSection("Seed").Get<SeedOptions>() ?? new SeedOptions();
            await DbSeeder.SeedAsync(db, userManager, roleManager, seedOptions);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Database migration/seed failed at startup.");
            throw;
        }
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Sentinel API terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}

// Exposed so WebApplicationFactory-based integration tests can reference the entry point.
public partial class Program { }

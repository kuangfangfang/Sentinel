using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Api.Controllers;
using Sentinel.Api.Dtos;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;
using Sentinel.Data;
using Xunit;

namespace Sentinel.Tests;

public class AuthControllerTests
{
    private const string InitialPassword = "OldPassword1";

    private static SentinelDbContext NewDb() =>
        new(new DbContextOptionsBuilder<SentinelDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static IOptions<IdentityOptions> IdentityOptions() =>
        Options.Create(new IdentityOptions
        {
            Password =
            {
                RequiredLength = 10,
                RequireDigit = true,
                RequireLowercase = true,
                RequireUppercase = false,
                RequireNonAlphanumeric = false,
            },
        });

    private static UserManager<ApplicationUser> NewUserManager(SentinelDbContext db)
    {
        var store = new UserStore<ApplicationUser, IdentityRole<Guid>, SentinelDbContext, Guid>(db);
        return new UserManager<ApplicationUser>(
            store,
            IdentityOptions(),
            new PasswordHasher<ApplicationUser>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            new IPasswordValidator<ApplicationUser>[] { new PasswordValidator<ApplicationUser>() },
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            services: null!,
            NullLogger<UserManager<ApplicationUser>>.Instance);
    }

    private static RoleManager<IdentityRole<Guid>> NewRoleManager(SentinelDbContext db)
    {
        var store = new RoleStore<IdentityRole<Guid>, SentinelDbContext, Guid>(db);
        return new RoleManager<IdentityRole<Guid>>(
            store,
            Array.Empty<IRoleValidator<IdentityRole<Guid>>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            NullLogger<RoleManager<IdentityRole<Guid>>>.Instance);
    }

    private static AuthController NewController(SentinelDbContext db, UserManager<ApplicationUser> users, ApplicationUser actor)
    {
        var httpContextAccessor = new HttpContextAccessor();
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, actor.Id.ToString()),
            ], "Test")),
        };
        httpContextAccessor.HttpContext = httpContext;

        var roles = NewRoleManager(db);
        var signInManager = new SignInManager<ApplicationUser>(
            users,
            httpContextAccessor,
            new UserClaimsPrincipalFactory<ApplicationUser, IdentityRole<Guid>>(users, roles, IdentityOptions()),
            IdentityOptions(),
            NullLogger<SignInManager<ApplicationUser>>.Instance,
            new AuthenticationSchemeProvider(Options.Create(new AuthenticationOptions())),
            null!);

        var controller = new AuthController(
            users,
            signInManager,
            new FakeTokenService(),
            new AuditService(db, httpContextAccessor))
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
        return controller;
    }

    private static async Task<ApplicationUser> SeedUserAsync(UserManager<ApplicationUser> users, string email)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = "Test User",
            EmailConfirmed = true,
        };
        (await users.CreateAsync(user, InitialPassword)).Succeeded.Should().BeTrue();
        return user;
    }

    [Fact]
    public async Task ChangePassword_succeeds_with_valid_current_password()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var user = await SeedUserAsync(users, "auth-success@sentinel.local");
        var controller = NewController(db, users, user);

        var result = await controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = InitialPassword,
            NewPassword = "NewPassword2",
        });

        result.Should().BeOfType<OkObjectResult>();
        (await users.CheckPasswordAsync(user, "NewPassword2")).Should().BeTrue();
    }

    [Fact]
    public async Task ChangePassword_fails_when_current_password_is_wrong()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var user = await SeedUserAsync(users, "auth-wrong@sentinel.local");
        var controller = NewController(db, users, user);

        var act = () => controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "WrongPassword1",
            NewPassword = "NewPassword2",
        });

        var ex = await act.Should().ThrowAsync<AppValidationException>();
        ex.Which.Errors["currentPassword"].Should().Contain("Current password is incorrect.");
    }

    [Fact]
    public async Task ChangePassword_fails_when_new_password_is_too_weak()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var user = await SeedUserAsync(users, "auth-weak@sentinel.local");
        var controller = NewController(db, users, user);

        var act = () => controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = InitialPassword,
            NewPassword = "short",
        });

        var ex = await act.Should().ThrowAsync<AppValidationException>();
        ex.Which.Errors["newPassword"].Should().NotBeEmpty();
    }
}

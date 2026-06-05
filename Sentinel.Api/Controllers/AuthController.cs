using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Api.Dtos;
using Sentinel.Api.Extensions;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;
using Sentinel.Core;
using Sentinel.Data;

namespace Sentinel.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IAuditService _audit;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        IAuditService audit)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _audit = audit;
    }

    /// <summary>Register a Complainant account (FR-5). Caseworkers are seeded, not self-registered (SRS 13.1).</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());

        var email = request.Email.Trim();
        if (await _userManager.FindByEmailAsync(email) is not null)
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["email"] = new[] { "An account with this email already exists." }
            });

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["password"] = result.Errors.Select(e => e.Description).ToArray()
            });

        await _userManager.AddToRoleAsync(user, Roles.Complainant);
        await _audit.LogAsync(AuditEvents.Register, user.Id, "Complainant self-registration");

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expires) = _tokenService.CreateToken(user, roles);
        return Created(string.Empty, new AuthResponse(token, expires, ToDto(user, roles)));
    }

    /// <summary>Authenticate and issue a JWT. Locks the account after five failures (FR-7, FR-9).</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());

        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            await _audit.LogAsync(AuditEvents.LoginFailed, null, $"Unknown email: {request.Email}");
            return Unauthorized(new ApiError("Invalid email or password.", HttpContext.TraceIdentifier));
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            await _audit.LogAsync(AuditEvents.AccountLockedOut, user.Id, "Account locked after repeated failures");
            return Unauthorized(new ApiError("This account is temporarily locked due to repeated failed sign-ins. Please try again later.", HttpContext.TraceIdentifier));
        }
        if (!result.Succeeded)
        {
            await _audit.LogAsync(AuditEvents.LoginFailed, user.Id, "Incorrect password");
            return Unauthorized(new ApiError("Invalid email or password.", HttpContext.TraceIdentifier));
        }

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expires) = _tokenService.CreateToken(user, roles);
        await _audit.LogAsync(AuditEvents.LoginSucceeded, user.Id);
        return Ok(new AuthResponse(token, expires, ToDto(user, roles)));
    }

    /// <summary>Stateless logout: the client discards the token. Recorded for audit (FR-10).</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (Guid.TryParse(_userManager.GetUserId(User), out var id))
            await _audit.LogAsync(AuditEvents.Logout, id);
        return Ok(new { message = "Signed out." });
    }

    /// <summary>Returns the current authenticated user, so the SPA can restore session on refresh.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) throw new NotFoundException("User not found.");
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(ToDto(user, roles));
    }

    /// <summary>Change the signed-in user's password (FR-12). Requires the current password.</summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());

        var user = await _userManager.GetUserAsync(User);
        if (user is null) throw new NotFoundException("User not found.");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "PasswordMismatch"))
            {
                throw new AppValidationException(new Dictionary<string, string[]>
                {
                    ["currentPassword"] = new[] { "Current password is incorrect." }
                });
            }

            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["newPassword"] = result.Errors.Select(e => e.Description).ToArray()
            });
        }

        await _audit.LogAsync(AuditEvents.PasswordChanged, user.Id);
        return Ok(new { message = "Password updated." });
    }

    private static UserDto ToDto(ApplicationUser user, IList<string> roles) =>
        new(user.Id, user.Email ?? string.Empty, user.FullName, roles.ToList());
}

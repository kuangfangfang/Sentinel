using System.ComponentModel.DataAnnotations;

namespace Sentinel.Api.Dtos;

public record RegisterRequest
{
    [Required, StringLength(150, MinimumLength = 2)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    // Policy (FR-12) is also enforced by Identity; the length floor is mirrored here for a fast message.
    [Required, StringLength(100, MinimumLength = 10)]
    public string Password { get; init; } = string.Empty;
}

public record LoginRequest
{
    [Required, EmailAddress] public string Email { get; init; } = string.Empty;
    [Required] public string Password { get; init; } = string.Empty;
}

public record ChangePasswordRequest
{
    [Required] public string CurrentPassword { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 10)]
    public string NewPassword { get; init; } = string.Empty;
}

public record AuthResponse(string Token, DateTime ExpiresAtUtc, UserDto User);

public record UserDto(Guid Id, string Email, string FullName, IReadOnlyList<string> Roles);

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Sentinel.Data;

namespace Sentinel.Api.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = "Sentinel.Api";
    public string Audience { get; set; } = "Sentinel.Web";
    public int ExpiryMinutes { get; set; } = 120;
    public string SigningKey { get; set; } = string.Empty;
}

public interface ITokenService
{
    (string token, DateTime expiresAtUtc) CreateToken(ApplicationUser user, IList<string> roles);
}

/// <summary>
/// Issues signed JWTs. In Path B the API and SPA are separate origins, so a
/// bearer token — not a cookie — carries identity and role across requests (guide §3).
/// </summary>
public class JwtTokenService : ITokenService
{
    private readonly JwtSettings _settings;
    public JwtTokenService(JwtSettings settings) => _settings = settings;

    public (string token, DateTime expiresAtUtc) CreateToken(ApplicationUser user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("name", user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}

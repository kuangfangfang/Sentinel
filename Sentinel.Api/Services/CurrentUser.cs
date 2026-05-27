using System.Security.Claims;

namespace Sentinel.Api.Services;

/// <summary>Reads the authenticated identity from the validated JWT on the current request.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Name { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public Guid? UserId =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email)
                            ?? Principal?.FindFirstValue("email");
    public string? Name => Principal?.FindFirstValue("name");
    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
    public bool IsInRole(string role) => Principal?.IsInRole(role) ?? false;
}

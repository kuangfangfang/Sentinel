namespace Sentinel.Core;

/// <summary>
/// Canonical role names used by ASP.NET Identity and authorisation policies.
/// Kept as constants so seeding, policies and attributes never drift apart.
/// </summary>
public static class Roles
{
    public const string Complainant = "Complainant";
    public const string Caseworker = "Caseworker";

    public static readonly string[] All = { Complainant, Caseworker };
}

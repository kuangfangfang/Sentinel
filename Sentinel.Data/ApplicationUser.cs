using Microsoft.AspNetCore.Identity;

namespace Sentinel.Data;

/// <summary>
/// A system user, extending ASP.NET Identity with a display name (SRS 5.1).
/// The role (Complainant or Caseworker) is carried by Identity's role tables.
/// Uses a GUID primary key to match the rest of the data model.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
}

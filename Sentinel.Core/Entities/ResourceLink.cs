namespace Sentinel.Core.Entities;

/// <summary>An entry in the public Resources directory of help lines and legal aid (SRS 5.1, FR-2).</summary>
public class ResourceLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? PhoneNumber { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

namespace Sentinel.Data;

/// <summary>
/// Controls database seeding. Demo data is for local development only.
/// Production should use <see cref="BootstrapCaseworkerEmail"/> + password via environment variables.
/// </summary>
public class SeedOptions
{
    /// <summary>When true, creates fictional demo users and sample complaints (Development only).</summary>
    public bool EnableDemoData { get; set; }

    public string? DemoCaseworkerEmail { get; set; }
    public string? DemoCaseworkerPassword { get; set; }
    public string? DemoComplainantEmail { get; set; }
    public string? DemoComplainantPassword { get; set; }

    /// <summary>First caseworker account for production — created once if it does not exist.</summary>
    public string? BootstrapCaseworkerEmail { get; set; }
    public string? BootstrapCaseworkerPassword { get; set; }
    public string? BootstrapCaseworkerFullName { get; set; }
}

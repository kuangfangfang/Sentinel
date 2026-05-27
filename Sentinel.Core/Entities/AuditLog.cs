namespace Sentinel.Core.Entities;

/// <summary>
/// A cross-cutting record of security-relevant events: logins, access denials,
/// status changes, exports (SRS 5.1, 6.4, NFR-10). Append-only.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? Detail { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

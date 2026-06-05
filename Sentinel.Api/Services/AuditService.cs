using Sentinel.Core.Entities;
using Sentinel.Data;

namespace Sentinel.Api.Services;

/// <summary>Canonical audit event type names (SRS 6.4, NFR-10).</summary>
public static class AuditEvents
{
    public const string Register = "AccountRegistered";
    public const string LoginSucceeded = "LoginSucceeded";
    public const string LoginFailed = "LoginFailed";
    public const string AccountLockedOut = "AccountLockedOut";
    public const string Logout = "Logout";
    public const string ComplaintSubmitted = "ComplaintSubmitted";
    public const string ComplaintAccessDenied = "ComplaintAccessDenied";
    public const string StatusChanged = "StatusChanged";
    public const string CaseNoteAdded = "CaseNoteAdded";
    public const string SeverityChanged = "SeverityChanged";
    public const string ComplaintAssigned = "ComplaintAssigned";
    public const string AttachmentUploaded = "AttachmentUploaded";
    public const string AttachmentDownloaded = "AttachmentDownloaded";
}

public interface IAuditService
{
    Task LogAsync(string eventType, Guid? userId = null, string? detail = null,
        string? entityType = null, string? entityId = null, CancellationToken ct = default);
}

/// <summary>Writes append-only audit rows for security-relevant events.</summary>
public class AuditService : IAuditService
{
    private readonly SentinelDbContext _db;
    private readonly IHttpContextAccessor _http;

    public AuditService(SentinelDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task LogAsync(string eventType, Guid? userId = null, string? detail = null,
        string? entityType = null, string? entityId = null, CancellationToken ct = default)
    {
        var ctx = _http.HttpContext;
        _db.AuditLogs.Add(new AuditLog
        {
            EventType = eventType,
            UserId = userId,
            Detail = detail,
            EntityType = entityType,
            EntityId = entityId,
            IpAddress = ctx?.Connection.RemoteIpAddress?.ToString(),
            CorrelationId = ctx?.TraceIdentifier,
        });
        await _db.SaveChangesAsync(ct);
    }
}

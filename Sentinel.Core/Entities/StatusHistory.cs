using Sentinel.Core.Enums;

namespace Sentinel.Core.Entities;

/// <summary>
/// An immutable record of every status change: who, from, to, when (SRS 5.1, 5.4, FR-33).
/// Append-only — the application never updates or deletes these rows.
/// </summary>
public class StatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    /// <summary>Null for the initial transition into Draft / Submitted.</summary>
    public ComplaintStatus? FromStatus { get; set; }
    public ComplaintStatus ToStatus { get; set; }

    public Guid? ChangedByUserId { get; set; }
    public string? ChangedByName { get; set; }
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

namespace Sentinel.Core.Entities;

/// <summary>
/// An internal note added by a caseworker. Visible to caseworkers only and
/// never exposed on any complainant-facing response (SRS 5.1, FR-34, AC-10).
/// </summary>
public class CaseNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public Guid AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

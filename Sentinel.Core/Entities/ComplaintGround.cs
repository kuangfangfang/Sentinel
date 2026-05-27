using Sentinel.Core.Enums;

namespace Sentinel.Core.Entities;

/// <summary>A selected ground of complaint plus any conditional detail (SRS 5.2.3, FR-17).</summary>
public class ComplaintGround
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public GroundType GroundType { get; set; }

    /// <summary>Follow-up answer the official form asks (e.g. the specific disability or race).</summary>
    public string? ConditionalDetail { get; set; }
}

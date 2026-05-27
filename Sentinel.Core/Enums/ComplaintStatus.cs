namespace Sentinel.Core.Enums;

/// <summary>
/// Lifecycle states of a complaint (SRS 5.2.1 / 5.5).
/// Persisted as integers (SRS 5.4). Transitions are governed by
/// <see cref="Sentinel.Core.Services.StatusTransitionService"/>.
/// </summary>
public enum ComplaintStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    MoreInfoNeeded = 4,
    Resolved = 5,
    Closed = 6,
    Withdrawn = 7
}

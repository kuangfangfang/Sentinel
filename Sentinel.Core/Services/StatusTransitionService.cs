using Sentinel.Core.Enums;

namespace Sentinel.Core.Services;

public interface IStatusTransitionService
{
    bool IsValid(ComplaintStatus from, ComplaintStatus to);
    IReadOnlyList<ComplaintStatus> AllowedNext(ComplaintStatus from);
    /// <summary>Throws <see cref="InvalidStatusTransitionException"/> if the transition is not permitted.</summary>
    void EnsureValid(ComplaintStatus from, ComplaintStatus to);
}

/// <summary>
/// Encodes the complaint status lifecycle (SRS 5.5). Only the listed transitions
/// are valid; the domain rejects anything else. This is a pure rule with no data
/// dependency, so it is fully unit-tested.
/// </summary>
public class StatusTransitionService : IStatusTransitionService
{
    private static readonly IReadOnlyDictionary<ComplaintStatus, ComplaintStatus[]> Map =
        new Dictionary<ComplaintStatus, ComplaintStatus[]>
        {
            [ComplaintStatus.Draft] = new[] { ComplaintStatus.Submitted, ComplaintStatus.Withdrawn },
            [ComplaintStatus.Submitted] = new[] { ComplaintStatus.UnderReview, ComplaintStatus.Withdrawn },
            [ComplaintStatus.UnderReview] = new[] { ComplaintStatus.MoreInfoNeeded, ComplaintStatus.Resolved, ComplaintStatus.Withdrawn },
            [ComplaintStatus.MoreInfoNeeded] = new[] { ComplaintStatus.UnderReview },
            [ComplaintStatus.Resolved] = new[] { ComplaintStatus.Closed },
            [ComplaintStatus.Closed] = Array.Empty<ComplaintStatus>(),
            [ComplaintStatus.Withdrawn] = Array.Empty<ComplaintStatus>(),
        };

    public bool IsValid(ComplaintStatus from, ComplaintStatus to) =>
        Map.TryGetValue(from, out var allowed) && Array.IndexOf(allowed, to) >= 0;

    public IReadOnlyList<ComplaintStatus> AllowedNext(ComplaintStatus from) =>
        Map.TryGetValue(from, out var allowed) ? allowed : Array.Empty<ComplaintStatus>();

    public void EnsureValid(ComplaintStatus from, ComplaintStatus to)
    {
        if (!IsValid(from, to))
            throw new InvalidStatusTransitionException(from, to);
    }
}

using Sentinel.Core.Enums;

namespace Sentinel.Core.Services;

public interface ITriageService
{
    /// <summary>Suggests a starting severity from the selected grounds, to help a caseworker triage.</summary>
    Severity SuggestSeverity(IEnumerable<GroundType> grounds);
}

/// <summary>
/// Simple, deterministic triage heuristic. It only *suggests* a severity; a
/// caseworker always has the final say (FR-35). Pure logic, so it is unit-tested.
/// </summary>
public class TriageService : ITriageService
{
    private static readonly HashSet<GroundType> HighPriorityGrounds = new()
    {
        GroundType.SexualHarassment,
        GroundType.SexBasedHarassment,
        GroundType.HostileWorkplaceOnGroundOfSex,
        GroundType.RacialHatred,
        GroundType.Victimisation,
        GroundType.HumanRightsBreachByCommonwealth,
    };

    public Severity SuggestSeverity(IEnumerable<GroundType> grounds)
    {
        var list = (grounds ?? Enumerable.Empty<GroundType>()).Distinct().ToList();
        if (list.Count == 0) return Severity.Low;

        var hasHighPriority = list.Any(HighPriorityGrounds.Contains);
        if (hasHighPriority && list.Count >= 3) return Severity.Critical;
        if (hasHighPriority) return Severity.High;
        if (list.Count >= 3) return Severity.Medium;
        return Severity.Low;
    }
}

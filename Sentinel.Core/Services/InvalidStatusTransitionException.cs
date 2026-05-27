using Sentinel.Core.Enums;

namespace Sentinel.Core.Services;

/// <summary>Raised when a caseworker attempts a status change not permitted by SRS 5.5.</summary>
public class InvalidStatusTransitionException : Exception
{
    public ComplaintStatus From { get; }
    public ComplaintStatus To { get; }

    public InvalidStatusTransitionException(ComplaintStatus from, ComplaintStatus to)
        : base($"Cannot change complaint status from {from} to {to}.")
    {
        From = from;
        To = to;
    }
}

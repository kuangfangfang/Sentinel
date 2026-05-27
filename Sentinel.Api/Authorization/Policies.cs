namespace Sentinel.Api.Authorization;

/// <summary>Names of the role-based authorisation policies (SRS 6.2, FR-8).</summary>
public static class Policies
{
    public const string ComplainantOnly = "ComplainantOnly";
    public const string CaseworkerOnly = "CaseworkerOnly";
}

using System.ComponentModel.DataAnnotations;
using Sentinel.Core.Enums;

namespace Sentinel.Api.Dtos;

/// <summary>Filter, search, sort and paging options for the caseworker queue (FR-30, FR-31).
/// Bound from the query string, so properties are settable.</summary>
public class QueueQuery
{
    public ComplaintStatus? Status { get; set; }
    public GroundType? Ground { get; set; }
    public Severity? Severity { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? Search { get; set; }
    public string? SortBy { get; set; }            // submitted | severity | status
    public bool SortDescending { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    /// <summary>Filter by the assigned caseworker. Used by "assigned to me" (FR-31).</summary>
    public Guid? AssigneeUserId { get; set; }
    /// <summary>When true, show only complaints with no assigned caseworker.</summary>
    public bool? Unassigned { get; set; }
    /// <summary>When true, show only open complaints (Submitted, UnderReview, MoreInfoNeeded).</summary>
    public bool? OpenOnly { get; set; }
    /// <summary>When true, show only High or Critical severity complaints.</summary>
    public bool? HighSeverityOnly { get; set; }
    /// <summary>When set, show complaints lodged more than this many days ago (matches dashboard aging count).</summary>
    public int? AgingDays { get; set; }
}

public record QueueItemDto(
    Guid Id, string? ReferenceCode, string Title, ComplaintStatus Status, Severity? Severity,
    string IncidentLocation, DateOnly? IncidentDate, DateTime? SubmittedAt, int RespondentCount, bool IsAnonymous,
    Guid? AssignedToUserId, string? AssignedToName);

/// <summary>A caseworker who can be assigned a complaint (FR-31).</summary>
public record CaseworkerOptionDto(Guid Id, string Name, string? Email);

/// <summary>Assign, reassign, claim, or unassign a complaint. Null assignee clears the assignment.</summary>
public record AssignRequest
{
    public Guid? AssigneeUserId { get; init; }
}

public record CaseNoteDto(Guid Id, string AuthorName, string Body, DateTime CreatedAt);

/// <summary>Caseworker view = the full complaint plus internal-only data (case notes).</summary>
public record CaseworkerComplaintDetailDto(ComplaintDetailDto Complaint, Guid? ComplainantUserId, List<CaseNoteDto> CaseNotes);

public record ChangeStatusRequest
{
    [Required] public ComplaintStatus ToStatus { get; init; }
    [StringLength(1000)] public string? Note { get; init; }
}

public record AddCaseNoteRequest
{
    [Required, MinLength(1, ErrorMessage = "A note cannot be empty.")]
    public string Body { get; init; } = string.Empty;
}

public record SetSeverityRequest
{
    [Required] public Severity Severity { get; init; }
}

public record DashboardSummaryDto(
    int Total, int OpenCount, Dictionary<string, int> ByStatus, Dictionary<string, int> ByGround,
    Dictionary<string, int> BySeverity,
    int Unassigned, int AssignedToMeOpen, int MyAwaitingInfo, int AgingOpen, int HighSeverityOpen);

public record CategoryCountDto(string Category, string ShortCategory, int Count);
public record MonthCountDto(string Month, int Lodged, int Resolved);
public record AnalyticsDto(List<CategoryCountDto> ByGround, List<CategoryCountDto> BySeverity, List<MonthCountDto> ByMonth);

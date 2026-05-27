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
}

public record QueueItemDto(
    Guid Id, string? ReferenceCode, string Title, ComplaintStatus Status, Severity? Severity,
    string IncidentLocation, DateOnly? IncidentDate, DateTime? SubmittedAt, int RespondentCount, bool IsAnonymous);

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
    int Total, int OpenCount, Dictionary<string, int> ByStatus, Dictionary<string, int> ByGround);

public record CategoryCountDto(string Category, int Count);
public record MonthCountDto(string Month, int Count);
public record AnalyticsDto(List<CategoryCountDto> ByGround, List<MonthCountDto> ByMonth);

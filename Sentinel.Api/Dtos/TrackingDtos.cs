using System.ComponentModel.DataAnnotations;
using Sentinel.Core.Enums;

namespace Sentinel.Api.Dtos;

public record TrackRequest
{
    [Required, StringLength(30, MinimumLength = 4)]
    public string ReferenceCode { get; init; } = string.Empty;
}

/// <summary>
/// Public status view for anyone holding a reference code (FR-27). Carries no
/// personal contact data — just the title, status and the change timeline.
/// </summary>
public record TrackResultDto(
    string ReferenceCode, string Title, ComplaintStatus Status,
    DateTime? SubmittedAt, DateTime UpdatedAt, List<StatusHistoryDto> StatusHistory);

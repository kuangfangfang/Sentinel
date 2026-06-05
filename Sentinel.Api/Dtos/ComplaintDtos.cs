using System.ComponentModel.DataAnnotations;
using Sentinel.Core.Enums;

namespace Sentinel.Api.Dtos;

// ---------------------------------------------------------------------------
// Nested pieces shared by input and output.
// ---------------------------------------------------------------------------

public record RespondentDto
{
    [Required, StringLength(200, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;
    [StringLength(20)] public string? AbnAcn { get; init; }
    [EmailAddress] public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public string? Mobile { get; init; }
    public string? AddressLine { get; init; }
    public string? Suburb { get; init; }
    public string? State { get; init; }
    [RegularExpression(@"^\d{4}$", ErrorMessage = "Postcode must be 4 digits.")]
    public string? Postcode { get; init; }
    [StringLength(200)] public string? RelationshipToComplainant { get; init; }
}

public record ComplainantContactDto
{
    [StringLength(40)] public string? Title { get; init; }
    [StringLength(100)] public string? FirstName { get; init; }
    [StringLength(100)] public string? LastName { get; init; }
    public string? AddressLine { get; init; }
    public string? Suburb { get; init; }
    public string? State { get; init; }
    [RegularExpression(@"^\d{4}$", ErrorMessage = "Postcode must be 4 digits.")]
    public string? Postcode { get; init; }
    [EmailAddress] public string? Email { get; init; }
    public string? PhoneAh { get; init; }
    public string? PhoneBh { get; init; }
    public string? AssistanceRequired { get; init; }
}

public record GroundSelectionDto
{
    public GroundType GroundType { get; init; }
    [StringLength(300)] public string? ConditionalDetail { get; init; }
}

public record OnBehalfOfDto
{
    [Required] public string FirstName { get; init; } = string.Empty;
    [Required] public string LastName { get; init; } = string.Empty;
    [EmailAddress] public string? Email { get; init; }
    public string? RelationshipToComplainant { get; init; }
    public string? AssistanceRequired { get; init; }
}

public record RepresentativeDto
{
    public string? Title { get; init; }
    [Required] public string FirstName { get; init; } = string.Empty;
    [Required] public string LastName { get; init; } = string.Empty;
    public string? Position { get; init; }
    public string? Organisation { get; init; }
    public string? AddressLine { get; init; }
    public string? Suburb { get; init; }
    public string? State { get; init; }
    [RegularExpression(@"^\d{4}$", ErrorMessage = "Postcode must be 4 digits.")]
    public string? Postcode { get; init; }
    [EmailAddress] public string? Email { get; init; }
    public string? PhoneBh { get; init; }
    public string? Mobile { get; init; }
    public string? AssistanceRequired { get; init; }
}

// ---------------------------------------------------------------------------
// Input — one shape used both for saving a draft (lenient) and for submitting
// (strict). The submit path enforces the validation attributes; the draft path
// persists whatever has been entered so far (FR-14).
// ---------------------------------------------------------------------------

public record ComplaintWriteDto
{
    [Required, StringLength(150, MinimumLength = 5)]
    public string Title { get; init; } = string.Empty;

    [Required, MinLength(20, ErrorMessage = "Please describe what happened in at least 20 characters.")]
    public string Description { get; init; } = string.Empty;

    [Required, NotInFuture]
    public DateOnly? IncidentDate { get; init; }

    [Required, StringLength(200, MinimumLength = 1)]
    public string IncidentLocation { get; init; } = string.Empty;

    public string? DesiredOutcome { get; init; }
    public ComplainantContactDto? ComplainantContact { get; init; }
    public string? ReferringOrganisation { get; init; }
    public bool? PriorComplaintMade { get; init; }
    [StringLength(200)] public string? PriorComplaintAgency { get; init; }
    public DateOnly? PriorComplaintDate { get; init; }
    [StringLength(120)] public string? PriorComplaintStatus { get; init; }
    public DateOnly? PriorComplaintFinalisedDate { get; init; }
    public string? PriorComplaintOutcome { get; init; }

    [StringLength(2000)] public string? DelayReason { get; init; }

    public bool InterpreterRequired { get; init; }
    [StringLength(60)] public string? PreferredLanguage { get; init; }

    [Required(ErrorMessage = "Please answer whether generative AI was used.")]
    public bool? GenAiUsed { get; init; }

    [MustBeTrue(ErrorMessage = "You must confirm you have read the privacy notice before lodging.")]
    public bool PrivacyNoticeAccepted { get; init; }

    [MinLength(1, ErrorMessage = "Select at least one ground of complaint.")]
    public List<GroundSelectionDto> Grounds { get; init; } = new();

    [MinLength(1, ErrorMessage = "Add at least one respondent (who the complaint is about).")]
    public List<RespondentDto> Respondents { get; init; } = new();

    public OnBehalfOfDto? OnBehalfOf { get; init; }
    public RepresentativeDto? Representative { get; init; }

    [Range(1, 5)] public int WizardStep { get; init; } = 1;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

public record ComplaintListItemDto(
    Guid Id, string? ReferenceCode, string Title, ComplaintStatus Status, Severity? Severity,
    DateTime? SubmittedAt, DateTime UpdatedAt, int WizardStep, bool IsAnonymous);

public record AttachmentDto(Guid Id, string OriginalFileName, string ContentType, long SizeBytes, string ScanStatus, DateTime UploadedAt);

public record StatusHistoryDto(ComplaintStatus? FromStatus, ComplaintStatus ToStatus, string? ChangedByName, string? Note, DateTime ChangedAt);

public record ComplaintDetailDto
{
    public Guid Id { get; init; }
    public string? ReferenceCode { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateOnly? IncidentDate { get; init; }
    public string IncidentLocation { get; init; } = string.Empty;
    public string? DesiredOutcome { get; init; }
    public ComplainantContactDto? ComplainantContact { get; init; }
    public string? ReferringOrganisation { get; init; }
    public bool? PriorComplaintMade { get; init; }
    public string? PriorComplaintAgency { get; init; }
    public DateOnly? PriorComplaintDate { get; init; }
    public string? PriorComplaintStatus { get; init; }
    public DateOnly? PriorComplaintFinalisedDate { get; init; }
    public string? PriorComplaintOutcome { get; init; }
    public string? DelayReason { get; init; }
    public ComplaintStatus Status { get; init; }
    public Severity? Severity { get; init; }
    public Guid? AssignedToUserId { get; init; }
    public string? AssignedToName { get; init; }
    public bool InterpreterRequired { get; init; }
    public string? PreferredLanguage { get; init; }
    public bool? GenAiUsed { get; init; }
    public bool IsAnonymous { get; init; }
    public int WizardStep { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public List<RespondentDto> Respondents { get; init; } = new();
    public List<GroundSelectionDto> Grounds { get; init; } = new();
    public OnBehalfOfDto? OnBehalfOf { get; init; }
    public RepresentativeDto? Representative { get; init; }
    public List<AttachmentDto> Attachments { get; init; } = new();
    public List<StatusHistoryDto> StatusHistory { get; init; } = new();
}

public record CreateDraftResponse(Guid Id);

public record SubmitResultDto(Guid Id, string ReferenceCode, ComplaintStatus Status, DateTime SubmittedAtUtc);

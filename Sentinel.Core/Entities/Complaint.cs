using Sentinel.Core.Enums;

namespace Sentinel.Core.Entities;

/// <summary>
/// The central record. A complaint exists as structured, queryable data rather
/// than prose in a document — this is Sentinel's core improvement over the paper
/// form (SRS 5.1).
/// </summary>
public class Complaint
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Unique, human-readable tracking code (e.g. SEN-2026-7F3K9Q). Null until submission.</summary>
    public string? ReferenceCode { get; set; }

    /// <summary>Null when the complaint is anonymous (SRS 5.2.1, FR-23).</summary>
    public Guid? ComplainantUserId { get; set; }
    public bool IsAnonymous { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Date of the alleged event(s). Required on submission; must not be in the future.</summary>
    public DateOnly? IncidentDate { get; set; }
    public string IncidentLocation { get; set; } = string.Empty;
    public string? DesiredOutcome { get; set; }
    public string? ReferringOrganisation { get; set; }
    public bool? PriorComplaintMade { get; set; }
    public string? PriorComplaintAgency { get; set; }
    public DateOnly? PriorComplaintDate { get; set; }
    public string? PriorComplaintStatus { get; set; }
    public DateOnly? PriorComplaintFinalisedDate { get; set; }
    public string? PriorComplaintOutcome { get; set; }

    /// <summary>If the event(s) happened more than 24 months ago, the complainant's
    /// explanation for the delay in lodging (AHRC form Part C, "Reason(s) for delay").</summary>
    public string? DelayReason { get; set; }

    public ComplaintStatus Status { get; set; } = ComplaintStatus.Draft;
    public Severity? Severity { get; set; }

    public bool InterpreterRequired { get; set; }
    public string? PreferredLanguage { get; set; }

    /// <summary>Mandatory GenAI-use disclosure (FR-21). Null while still a draft.</summary>
    public bool? GenAiUsed { get; set; }

    /// <summary>Timestamp the complainant accepted the privacy collection notice (FR-20, SRS 6.4).</summary>
    public DateTime? PrivacyNoticeAcceptedAt { get; set; }

    /// <summary>Highest wizard step reached (1-5), so a draft can be resumed (FR-14).</summary>
    public int WizardStep { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Respondent> Respondents { get; set; } = new List<Respondent>();
    public ICollection<ComplaintGround> Grounds { get; set; } = new List<ComplaintGround>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<CaseNote> CaseNotes { get; set; } = new List<CaseNote>();
    public ICollection<StatusHistory> StatusHistory { get; set; } = new List<StatusHistory>();
    public OnBehalfOfPerson? OnBehalfOfPerson { get; set; }
    public AssistingRepresentative? AssistingRepresentative { get; set; }
}

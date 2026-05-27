namespace Sentinel.Core.Entities;

/// <summary>
/// Details of the person a complaint is lodged for, when that is not the
/// complainant themselves (SRS 5.1, FR-16; AHRC form Part A). Zero-or-one per complaint.
/// </summary>
public class OnBehalfOfPerson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? RelationshipToComplainant { get; set; }
    public string? AssistanceRequired { get; set; }
}

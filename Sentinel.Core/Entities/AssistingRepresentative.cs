namespace Sentinel.Core.Entities;

/// <summary>
/// Details of a legal/advocacy representative assisting the complainant
/// (SRS 5.1; AHRC form Part A). Zero-or-one per complaint.
/// </summary>
public class AssistingRepresentative
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public string? Title { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? Organisation { get; set; }
    public string? AddressLine { get; set; }
    public string? Suburb { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
    public string? Email { get; set; }
    public string? PhoneBh { get; set; }
    public string? Mobile { get; set; }
    public string? AssistanceRequired { get; set; }
}

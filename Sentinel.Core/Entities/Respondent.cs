namespace Sentinel.Core.Entities;

/// <summary>A person or organisation a complaint is about (SRS 5.2.2). Many per complaint (FR-15).</summary>
public class Respondent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? AbnAcn { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? AddressLine { get; set; }
    public string? Suburb { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
    public string? RelationshipToComplainant { get; set; }
}

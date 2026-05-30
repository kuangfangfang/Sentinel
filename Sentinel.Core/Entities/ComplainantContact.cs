namespace Sentinel.Core.Entities;

/// <summary>
/// Contact details supplied by the complainant for this complaint. This is
/// separate from Identity so anonymous complaints can optionally include contact
/// details without being linked to an account.
/// </summary>
public class ComplainantContact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public string? Title { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AddressLine { get; set; }
    public string? Suburb { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
    public string? Email { get; set; }
    public string? PhoneAh { get; set; }
    public string? PhoneBh { get; set; }
    public string? AssistanceRequired { get; set; }
}

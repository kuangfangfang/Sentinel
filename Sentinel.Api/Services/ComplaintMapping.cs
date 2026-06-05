using Sentinel.Api.Dtos;
using Sentinel.Core.Entities;

namespace Sentinel.Api.Services;

/// <summary>Maps complaint entities to the DTOs returned by the API.</summary>
public static class ComplaintMapping
{
    public static RespondentDto ToDto(Respondent r) => new()
    {
        Name = r.Name,
        AbnAcn = r.AbnAcn,
        ContactEmail = r.ContactEmail,
        ContactPhone = r.ContactPhone,
        Mobile = r.Mobile,
        AddressLine = r.AddressLine,
        Suburb = r.Suburb,
        State = r.State,
        Postcode = r.Postcode,
        RelationshipToComplainant = r.RelationshipToComplainant,
    };

    public static ComplainantContactDto? ToDto(ComplainantContact? c) => c is null ? null : new ComplainantContactDto
    {
        Title = c.Title,
        FirstName = c.FirstName,
        LastName = c.LastName,
        AddressLine = c.AddressLine,
        Suburb = c.Suburb,
        State = c.State,
        Postcode = c.Postcode,
        Email = c.Email,
        PhoneAh = c.PhoneAh,
        PhoneBh = c.PhoneBh,
        AssistanceRequired = c.AssistanceRequired,
    };

    public static GroundSelectionDto ToDto(ComplaintGround g) =>
        new() { GroundType = g.GroundType, ConditionalDetail = g.ConditionalDetail };

    public static StatusHistoryDto ToDto(StatusHistory s) =>
        new(s.FromStatus, s.ToStatus, s.ChangedByName, s.Note, s.ChangedAt);

    public static AttachmentDto ToDto(Attachment a) =>
        new(a.Id, a.OriginalFileName, a.ContentType, a.SizeBytes, a.ScanStatus.ToString(), a.UploadedAt);

    public static OnBehalfOfDto? ToDto(OnBehalfOfPerson? p) => p is null ? null : new OnBehalfOfDto
    {
        FirstName = p.FirstName,
        LastName = p.LastName,
        Email = p.Email,
        RelationshipToComplainant = p.RelationshipToComplainant,
        AssistanceRequired = p.AssistanceRequired,
    };

    public static RepresentativeDto? ToDto(AssistingRepresentative? r) => r is null ? null : new RepresentativeDto
    {
        Title = r.Title,
        FirstName = r.FirstName,
        LastName = r.LastName,
        Position = r.Position,
        Organisation = r.Organisation,
        AddressLine = r.AddressLine,
        Suburb = r.Suburb,
        State = r.State,
        Postcode = r.Postcode,
        Email = r.Email,
        PhoneBh = r.PhoneBh,
        Mobile = r.Mobile,
        AssistanceRequired = r.AssistanceRequired,
    };

    public static ComplaintDetailDto ToDetail(Complaint c) => new()
    {
        Id = c.Id,
        ReferenceCode = c.ReferenceCode,
        Title = c.Title,
        Description = c.Description,
        IncidentDate = c.IncidentDate,
        IncidentLocation = c.IncidentLocation,
        DesiredOutcome = c.DesiredOutcome,
        ComplainantContact = ToDto(c.ComplainantContact),
        ReferringOrganisation = c.ReferringOrganisation,
        PriorComplaintMade = c.PriorComplaintMade,
        PriorComplaintAgency = c.PriorComplaintAgency,
        PriorComplaintDate = c.PriorComplaintDate,
        PriorComplaintStatus = c.PriorComplaintStatus,
        PriorComplaintFinalisedDate = c.PriorComplaintFinalisedDate,
        PriorComplaintOutcome = c.PriorComplaintOutcome,
        DelayReason = c.DelayReason,
        Status = c.Status,
        Severity = c.Severity,
        AssignedToUserId = c.AssignedToUserId,
        AssignedToName = c.AssignedToName,
        InterpreterRequired = c.InterpreterRequired,
        PreferredLanguage = c.PreferredLanguage,
        GenAiUsed = c.GenAiUsed,
        IsAnonymous = c.IsAnonymous,
        WizardStep = c.WizardStep,
        CreatedAt = c.CreatedAt,
        SubmittedAt = c.SubmittedAt,
        UpdatedAt = c.UpdatedAt,
        Respondents = c.Respondents.Select(ToDto).ToList(),
        Grounds = c.Grounds.Select(ToDto).ToList(),
        OnBehalfOf = ToDto(c.OnBehalfOfPerson),
        Representative = ToDto(c.AssistingRepresentative),
        Attachments = c.Attachments.Select(ToDto).ToList(),
        StatusHistory = c.StatusHistory.OrderBy(s => s.ChangedAt).Select(ToDto).ToList(),
    };

    public static ComplaintListItemDto ToListItem(Complaint c) =>
        new(c.Id, c.ReferenceCode, c.Title, c.Status, c.Severity, c.SubmittedAt, c.UpdatedAt, c.WizardStep, c.IsAnonymous);
}

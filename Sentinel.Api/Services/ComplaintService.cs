using Microsoft.EntityFrameworkCore;
using Sentinel.Api.Dtos;
using Sentinel.Api.Middleware;
using Sentinel.Core.Entities;
using Sentinel.Core.Enums;
using Sentinel.Core.Services;
using Sentinel.Data;

namespace Sentinel.Api.Services;

/// <summary>
/// Orchestrates the complainant-facing complaint flows. Pure business rules live
/// in Sentinel.Core (reference codes, status transitions, triage); this service
/// coordinates them with the database. Controllers stay thin.
/// </summary>
public class ComplaintService
{
    private readonly SentinelDbContext _db;
    private readonly ICurrentUser _current;
    private readonly IReferenceCodeGenerator _codeGenerator;
    private readonly IStatusTransitionService _transitions;
    private readonly ITriageService _triage;
    private readonly IAuditService _audit;
    private readonly IFileStorageService _files;
    private readonly IVirusScanner _scanner;
    private readonly FileStorageOptions _fileOptions;

    public ComplaintService(
        SentinelDbContext db, ICurrentUser current, IReferenceCodeGenerator codeGenerator,
        IStatusTransitionService transitions, ITriageService triage, IAuditService audit,
        IFileStorageService files, IVirusScanner scanner, FileStorageOptions fileOptions)
    {
        _db = db;
        _current = current;
        _codeGenerator = codeGenerator;
        _transitions = transitions;
        _triage = triage;
        _audit = audit;
        _files = files;
        _scanner = scanner;
        _fileOptions = fileOptions;
    }

    private Guid RequireUserId() =>
        _current.UserId ?? throw new ForbiddenException("You must be signed in to do this.");

    public async Task<CreateDraftResponse> CreateDraftAsync(CancellationToken ct)
    {
        var userId = RequireUserId();
        var complaint = new Complaint
        {
            ComplainantUserId = userId,
            IsAnonymous = false,
            Status = ComplaintStatus.Draft,
            WizardStep = 1,
        };
        complaint.StatusHistory.Add(new StatusHistory
        {
            FromStatus = null,
            ToStatus = ComplaintStatus.Draft,
            ChangedByUserId = userId,
            ChangedByName = _current.Name,
        });
        _db.Complaints.Add(complaint);
        await _db.SaveChangesAsync(ct);
        return new CreateDraftResponse(complaint.Id);
    }

    public async Task SaveDraftAsync(Guid id, ComplaintWriteDto dto, CancellationToken ct)
    {
        var userId = RequireUserId();
        var complaint = await LoadOwnedAsync(id, userId, ct);
        if (complaint.Status != ComplaintStatus.Draft)
            throw new ConflictException("This complaint has already been lodged and can no longer be edited.");

        ApplyWrite(complaint, dto, finalising: false);
        complaint.WizardStep = Math.Clamp(Math.Max(complaint.WizardStep, dto.WizardStep), 1, 5);
        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<SubmitResultDto> SubmitAsync(Guid id, ComplaintWriteDto dto, CancellationToken ct)
    {
        var userId = RequireUserId();
        var complaint = await LoadOwnedAsync(id, userId, ct);
        if (complaint.Status != ComplaintStatus.Draft)
            throw new ConflictException("This complaint has already been lodged.");

        ApplyWrite(complaint, dto, finalising: true);
        await FinaliseAsync(complaint, userId, _current.Name, ct);
        return ToResult(complaint);
    }

    public async Task<SubmitResultDto> SubmitAnonymousAsync(ComplaintWriteDto dto, CancellationToken ct)
    {
        var complaint = new Complaint
        {
            IsAnonymous = true,
            ComplainantUserId = null,
            Status = ComplaintStatus.Draft,
        };
        complaint.StatusHistory.Add(new StatusHistory { FromStatus = null, ToStatus = ComplaintStatus.Draft });
        _db.Complaints.Add(complaint);

        ApplyWrite(complaint, dto, finalising: true);
        await FinaliseAsync(complaint, actorUserId: null, actorName: null, ct);
        return ToResult(complaint);
    }

    public async Task<IReadOnlyList<ComplaintListItemDto>> GetMineAsync(CancellationToken ct)
    {
        var userId = RequireUserId();
        var list = await _db.Complaints
            .Where(c => c.ComplainantUserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);
        return list.Select(ComplaintMapping.ToListItem).ToList();
    }

    public async Task<ComplaintDetailDto> GetOwnDetailAsync(Guid id, CancellationToken ct)
    {
        var userId = RequireUserId();
        var complaint = await LoadWithChildren()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        // Insecure-direct-object-reference defence (SRS 6.2, AC-8): ownership is
        // checked server-side; another user's id yields 404 and an audit entry.
        if (complaint is null || complaint.ComplainantUserId != userId)
        {
            await _audit.LogAsync(AuditEvents.ComplaintAccessDenied, userId,
                $"Attempt to access complaint {id} that the user does not own.", "Complaint", id.ToString(), ct);
            throw new NotFoundException("Complaint not found.");
        }
        return ComplaintMapping.ToDetail(complaint);
    }

    public async Task DeleteOwnDraftAsync(Guid id, CancellationToken ct)
    {
        var userId = RequireUserId();
        var complaint = await LoadOwnedAsync(id, userId, ct);
        if (complaint.Status != ComplaintStatus.Draft)
            throw new ConflictException("Only draft complaints can be deleted.");
        _db.Complaints.Remove(complaint);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AttachmentDto> AddAttachmentAsync(Guid id, IFormFile file, CancellationToken ct)
    {
        var userId = RequireUserId();
        var complaint = await LoadOwnedAsync(id, userId, ct);
        if (complaint.Status != ComplaintStatus.Draft)
            throw new ConflictException("Evidence can only be added while the complaint is a draft.");

        if (file.Length == 0)
            throw new ConflictException("The uploaded file is empty.");
        if (file.Length > _fileOptions.MaxFileBytes)
            throw new ConflictException($"Each file must be {_fileOptions.MaxFileBytes / (1024 * 1024)} MB or smaller.");
        if (complaint.Attachments.Count >= _fileOptions.MaxFilesPerComplaint)
            throw new ConflictException($"A complaint may have at most {_fileOptions.MaxFilesPerComplaint} files.");

        await using var stream = file.OpenReadStream();
        if (!EvidenceFile.IsAllowed(stream, file.FileName, out var contentType))
            throw new ConflictException("Only PDF, JPG, PNG and DOCX files are accepted.");

        var scan = await _scanner.ScanAsync(stream, file.FileName, ct);
        if (scan == FileScanStatus.Infected)
            throw new ConflictException("The file failed the virus scan and was rejected.");

        stream.Position = 0;
        var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        await _files.SaveAsync(stream, storedName, ct);

        var attachment = new Attachment
        {
            ComplaintId = complaint.Id,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = storedName,
            ContentType = contentType,
            SizeBytes = file.Length,
            ScanStatus = scan,
        };
        _db.Attachments.Add(attachment);
        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditEvents.AttachmentUploaded, userId, attachment.OriginalFileName, "Complaint", id.ToString(), ct);
        return ComplaintMapping.ToDto(attachment);
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> OpenAttachmentAsync(Guid complaintId, Guid attachmentId, CancellationToken ct)
    {
        var userId = _current.UserId;
        var isCaseworker = _current.IsInRole(Core.Roles.Caseworker);

        var complaint = await _db.Complaints
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == complaintId, ct);
        var attachment = complaint?.Attachments.FirstOrDefault(a => a.Id == attachmentId);

        // Served only to the owning complainant or to a caseworker (SRS 7.3).
        var ownsIt = complaint is not null && userId is not null && complaint.ComplainantUserId == userId;
        if (complaint is null || attachment is null || !(ownsIt || isCaseworker))
        {
            await _audit.LogAsync(AuditEvents.ComplaintAccessDenied, userId,
                $"Attempt to download attachment {attachmentId} of complaint {complaintId}.", "Attachment", attachmentId.ToString(), ct);
            throw new NotFoundException("File not found.");
        }
        if (!_files.Exists(attachment.StoredFileName))
            throw new NotFoundException("File not found.");

        await _audit.LogAsync(AuditEvents.AttachmentDownloaded, userId, attachment.OriginalFileName, "Attachment", attachmentId.ToString(), ct);
        return (_files.OpenRead(attachment.StoredFileName), attachment.ContentType, attachment.OriginalFileName);
    }

    // ----- internals -----

    private IQueryable<Complaint> LoadWithChildren() => _db.Complaints
        .Include(c => c.ComplainantContact)
        .Include(c => c.Respondents)
        .Include(c => c.Grounds)
        .Include(c => c.Attachments)
        .Include(c => c.StatusHistory)
        .Include(c => c.OnBehalfOfPerson)
        .Include(c => c.AssistingRepresentative);

    private async Task<Complaint> LoadOwnedAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var complaint = await LoadWithChildren().FirstOrDefaultAsync(c => c.Id == id, ct);
        if (complaint is null || complaint.ComplainantUserId != userId)
        {
            await _audit.LogAsync(AuditEvents.ComplaintAccessDenied, userId,
                $"Attempt to access complaint {id} that the user does not own.", "Complaint", id.ToString(), ct);
            throw new NotFoundException("Complaint not found.");
        }
        return complaint;
    }

    private async Task FinaliseAsync(Complaint complaint, Guid? actorUserId, string? actorName, CancellationToken ct)
    {
        _transitions.EnsureValid(ComplaintStatus.Draft, ComplaintStatus.Submitted);

        string code;
        do { code = _codeGenerator.Generate(DateTime.UtcNow); }
        while (await _db.Complaints.AnyAsync(c => c.ReferenceCode == code, ct));

        var now = DateTime.UtcNow;
        complaint.ReferenceCode = code;
        complaint.Status = ComplaintStatus.Submitted;
        complaint.SubmittedAt = now;
        complaint.UpdatedAt = now;
        complaint.PrivacyNoticeAcceptedAt = now;
        complaint.WizardStep = 5;
        // Initial triage hint a caseworker can override (FR-35).
        complaint.Severity = _triage.SuggestSeverity(complaint.Grounds.Select(g => g.GroundType));
        var transition = new StatusHistory
        {
            ComplaintId = complaint.Id,
            FromStatus = ComplaintStatus.Draft,
            ToStatus = ComplaintStatus.Submitted,
            ChangedByUserId = actorUserId,
            ChangedByName = actorName,
            ChangedAt = now,
        };
        complaint.StatusHistory.Add(transition);
        _db.StatusHistories.Add(transition);

        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditEvents.ComplaintSubmitted, actorUserId, $"Reference {code}", "Complaint", complaint.Id.ToString(), ct);
    }

    private void ApplyWrite(Complaint complaint, ComplaintWriteDto dto, bool finalising)
    {
        complaint.Title = dto.Title;
        complaint.Description = dto.Description;
        complaint.IncidentDate = dto.IncidentDate;
        complaint.IncidentLocation = dto.IncidentLocation;
        complaint.DesiredOutcome = dto.DesiredOutcome;
        ApplyComplainantContact(complaint, dto.ComplainantContact, finalising);
        complaint.ReferringOrganisation = dto.ReferringOrganisation;
        complaint.PriorComplaintMade = dto.PriorComplaintMade;
        complaint.PriorComplaintAgency = dto.PriorComplaintMade == true ? dto.PriorComplaintAgency : null;
        complaint.PriorComplaintDate = dto.PriorComplaintMade == true ? dto.PriorComplaintDate : null;
        complaint.PriorComplaintStatus = dto.PriorComplaintMade == true ? dto.PriorComplaintStatus : null;
        complaint.PriorComplaintFinalisedDate = dto.PriorComplaintMade == true ? dto.PriorComplaintFinalisedDate : null;
        complaint.PriorComplaintOutcome = dto.PriorComplaintMade == true ? dto.PriorComplaintOutcome : null;
        complaint.DelayReason = dto.DelayReason;
        complaint.InterpreterRequired = dto.InterpreterRequired;
        complaint.PreferredLanguage = dto.PreferredLanguage;
        complaint.GenAiUsed = dto.GenAiUsed;
        if (finalising && dto.PrivacyNoticeAccepted)
            complaint.PrivacyNoticeAcceptedAt = DateTime.UtcNow;

        // Replace child collections with the submitted set. New rows are added
        // explicitly through the DbSet (with the FK set) so EF marks them Added even
        // though their GUID keys are pre-initialised. Otherwise, when the parent is an
        // already-tracked draft, EF's "is the key set?" heuristic treats them as
        // existing rows and tries to UPDATE records that do not exist.
        _db.Respondents.RemoveRange(complaint.Respondents);
        complaint.Respondents = dto.Respondents.Select(r => new Respondent
        {
            ComplaintId = complaint.Id,
            Name = r.Name, AbnAcn = r.AbnAcn, ContactEmail = r.ContactEmail, ContactPhone = r.ContactPhone, Mobile = r.Mobile,
            AddressLine = r.AddressLine, Suburb = r.Suburb, State = r.State, Postcode = r.Postcode,
            RelationshipToComplainant = r.RelationshipToComplainant,
        }).ToList();
        _db.Respondents.AddRange(complaint.Respondents);

        _db.ComplaintGrounds.RemoveRange(complaint.Grounds);
        complaint.Grounds = dto.Grounds.Select(g => new ComplaintGround
        {
            ComplaintId = complaint.Id,
            GroundType = g.GroundType, ConditionalDetail = g.ConditionalDetail,
        }).ToList();
        _db.ComplaintGrounds.AddRange(complaint.Grounds);

        if (complaint.OnBehalfOfPerson is not null) _db.OnBehalfOfPersons.Remove(complaint.OnBehalfOfPerson);
        complaint.OnBehalfOfPerson = dto.OnBehalfOf is null ? null : new OnBehalfOfPerson
        {
            ComplaintId = complaint.Id,
            FirstName = dto.OnBehalfOf.FirstName, LastName = dto.OnBehalfOf.LastName, Email = dto.OnBehalfOf.Email,
            RelationshipToComplainant = dto.OnBehalfOf.RelationshipToComplainant, AssistanceRequired = dto.OnBehalfOf.AssistanceRequired,
        };
        if (complaint.OnBehalfOfPerson is not null) _db.OnBehalfOfPersons.Add(complaint.OnBehalfOfPerson);

        if (complaint.AssistingRepresentative is not null) _db.AssistingRepresentatives.Remove(complaint.AssistingRepresentative);
        complaint.AssistingRepresentative = dto.Representative is null ? null : new AssistingRepresentative
        {
            ComplaintId = complaint.Id,
            Title = dto.Representative.Title, FirstName = dto.Representative.FirstName, LastName = dto.Representative.LastName,
            Position = dto.Representative.Position, Organisation = dto.Representative.Organisation, AddressLine = dto.Representative.AddressLine,
            Suburb = dto.Representative.Suburb, State = dto.Representative.State, Postcode = dto.Representative.Postcode,
            Email = dto.Representative.Email, PhoneBh = dto.Representative.PhoneBh, Mobile = dto.Representative.Mobile,
            AssistanceRequired = dto.Representative.AssistanceRequired,
        };
        if (complaint.AssistingRepresentative is not null) _db.AssistingRepresentatives.Add(complaint.AssistingRepresentative);
    }

    private void ApplyComplainantContact(Complaint complaint, ComplainantContactDto? dto, bool finalising)
    {
        if (finalising && !complaint.IsAnonymous)
        {
            var errors = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(dto?.FirstName))
                errors["complainantContact.firstName"] = ["Please provide your first name."];
            if (string.IsNullOrWhiteSpace(dto?.LastName))
                errors["complainantContact.lastName"] = ["Please provide your last name."];
            if (string.IsNullOrWhiteSpace(dto?.Email))
                errors["complainantContact.email"] = ["Please provide your email address."];
            if (string.IsNullOrWhiteSpace(dto?.AddressLine))
                errors["complainantContact.addressLine"] = ["Please provide your address."];
            if (string.IsNullOrWhiteSpace(dto?.State))
                errors["complainantContact.state"] = ["Please select your state or territory."];
            if (string.IsNullOrWhiteSpace(dto?.Suburb))
                errors["complainantContact.suburb"] = ["Please select your suburb."];
            if (string.IsNullOrWhiteSpace(dto?.Postcode))
                errors["complainantContact.postcode"] = ["Please provide your postcode."];
            if (errors.Count > 0) throw new AppValidationException(errors);
        }

        var hasDetails = dto is not null && new[]
        {
            dto.Title, dto.FirstName, dto.LastName, dto.AddressLine, dto.Suburb, dto.State,
            dto.Postcode, dto.Email, dto.PhoneAh, dto.PhoneBh, dto.AssistanceRequired,
        }.Any(value => !string.IsNullOrWhiteSpace(value));

        if (complaint.ComplainantContact is not null)
            _db.ComplainantContacts.Remove(complaint.ComplainantContact);

        complaint.ComplainantContact = hasDetails ? new ComplainantContact
        {
            ComplaintId = complaint.Id,
            Title = dto!.Title,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            AddressLine = dto.AddressLine,
            Suburb = dto.Suburb,
            State = dto.State,
            Postcode = dto.Postcode,
            Email = dto.Email,
            PhoneAh = dto.PhoneAh,
            PhoneBh = dto.PhoneBh,
            AssistanceRequired = dto.AssistanceRequired,
        } : null;

        if (complaint.ComplainantContact is not null)
            _db.ComplainantContacts.Add(complaint.ComplainantContact);
    }

    private static SubmitResultDto ToResult(Complaint c) =>
        new(c.Id, c.ReferenceCode!, c.Status, c.SubmittedAt ?? DateTime.UtcNow);
}

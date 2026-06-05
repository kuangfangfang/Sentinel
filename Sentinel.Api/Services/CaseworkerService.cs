using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sentinel.Api.Dtos;
using Sentinel.Api.Middleware;
using Sentinel.Core.Entities;
using Sentinel.Core.Enums;
using Sentinel.Core.Services;
using Sentinel.Data;

namespace Sentinel.Api.Services;

/// <summary>
/// Caseworker triage and case-management operations (FR-29 to FR-35). All actions
/// here are reachable only behind the Caseworker role policy.
/// </summary>
public class CaseworkerService
{
    private readonly SentinelDbContext _db;
    private readonly ICurrentUser _current;
    private readonly IStatusTransitionService _transitions;
    private readonly IAuditService _audit;
    private readonly UserManager<ApplicationUser> _users;

    public CaseworkerService(
        SentinelDbContext db,
        ICurrentUser current,
        IStatusTransitionService transitions,
        IAuditService audit,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _current = current;
        _transitions = transitions;
        _audit = audit;
        _users = users;
    }

    public async Task<PagedResult<QueueItemDto>> GetQueueAsync(QueueQuery q, CancellationToken ct)
    {
        // Caseworkers triage lodged complaints, never other people's drafts.
        var query = _db.Complaints.AsNoTracking().Where(c => c.Status != ComplaintStatus.Draft);

        if (q.Status is { } status) query = query.Where(c => c.Status == status);
        if (q.Severity is { } severity) query = query.Where(c => c.Severity == severity);
        if (q.Ground is { } ground) query = query.Where(c => c.Grounds.Any(g => g.GroundType == ground));
        if (q.Unassigned == true) query = query.Where(c => c.AssignedToUserId == null);
        else if (q.AssigneeUserId is { } assignee) query = query.Where(c => c.AssignedToUserId == assignee);

        if (q.FromDate is { } from)
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            query = query.Where(c => c.SubmittedAt >= fromDt);
        }
        if (q.ToDate is { } to)
        {
            var toDt = to.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(c => c.SubmittedAt <= toDt);
        }
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(c =>
                (c.ReferenceCode != null && c.ReferenceCode.Contains(s)) ||
                c.Title.Contains(s) ||
                c.Description.Contains(s));
        }

        query = (q.SortBy?.ToLowerInvariant()) switch
        {
            "severity" => q.SortDescending ? query.OrderByDescending(c => c.Severity) : query.OrderBy(c => c.Severity),
            "status" => q.SortDescending ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
            _ => q.SortDescending ? query.OrderByDescending(c => c.SubmittedAt) : query.OrderBy(c => c.SubmittedAt),
        };

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 100);
        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new QueueItemDto(
                c.Id, c.ReferenceCode, c.Title, c.Status, c.Severity,
                c.IncidentLocation, c.IncidentDate, c.SubmittedAt, c.Respondents.Count, c.IsAnonymous,
                c.AssignedToUserId, c.AssignedToName))
            .ToListAsync(ct);

        return new PagedResult<QueueItemDto>(items, page, pageSize, total);
    }

    public async Task<CaseworkerComplaintDetailDto> GetDetailAsync(Guid id, CancellationToken ct)
    {
        var complaint = await LoadFull().FirstOrDefaultAsync(c => c.Id == id && c.Status != ComplaintStatus.Draft, ct);
        if (complaint is null) throw new NotFoundException("Complaint not found.");
        return ToCaseworkerDetail(complaint);
    }

    public async Task<CaseworkerComplaintDetailDto> ChangeStatusAsync(Guid id, ChangeStatusRequest req, CancellationToken ct)
    {
        var complaint = await LoadFull().FirstOrDefaultAsync(c => c.Id == id && c.Status != ComplaintStatus.Draft, ct);
        if (complaint is null) throw new NotFoundException("Complaint not found.");

        // SRS 5.5 — the domain rejects any transition not on the allowed list.
        _transitions.EnsureValid(complaint.Status, req.ToStatus);

        var now = DateTime.UtcNow;
        var from = complaint.Status;
        complaint.Status = req.ToStatus;
        complaint.UpdatedAt = now;
        var history = new StatusHistory
        {
            ComplaintId = complaint.Id,
            FromStatus = from,
            ToStatus = req.ToStatus,
            ChangedByUserId = _current.UserId,
            ChangedByName = _current.Name,
            Note = req.Note,
            ChangedAt = now,
        };
        complaint.StatusHistory.Add(history);
        _db.StatusHistories.Add(history);
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditEvents.StatusChanged, _current.UserId, $"{from} -> {req.ToStatus}", "Complaint", id.ToString(), ct);
        return ToCaseworkerDetail(complaint);
    }

    public async Task<CaseNoteDto> AddNoteAsync(Guid id, AddCaseNoteRequest req, CancellationToken ct)
    {
        var complaint = await _db.Complaints.FirstOrDefaultAsync(c => c.Id == id && c.Status != ComplaintStatus.Draft, ct);
        if (complaint is null) throw new NotFoundException("Complaint not found.");

        var note = new CaseNote
        {
            ComplaintId = id,
            AuthorUserId = _current.UserId ?? Guid.Empty,
            AuthorName = _current.Name ?? "Caseworker",
            Body = req.Body.Trim(),
        };
        _db.CaseNotes.Add(note);
        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditEvents.CaseNoteAdded, _current.UserId, null, "Complaint", id.ToString(), ct);
        return new CaseNoteDto(note.Id, note.AuthorName, note.Body, note.CreatedAt);
    }

    public async Task<CaseworkerComplaintDetailDto> SetSeverityAsync(Guid id, SetSeverityRequest req, CancellationToken ct)
    {
        var complaint = await LoadFull().FirstOrDefaultAsync(c => c.Id == id && c.Status != ComplaintStatus.Draft, ct);
        if (complaint is null) throw new NotFoundException("Complaint not found.");

        complaint.Severity = req.Severity;
        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditEvents.SeverityChanged, _current.UserId, req.Severity.ToString(), "Complaint", id.ToString(), ct);
        return ToCaseworkerDetail(complaint);
    }

    public async Task<CaseworkerComplaintDetailDto> AssignAsync(Guid id, AssignRequest req, CancellationToken ct)
    {
        var complaint = await LoadFull().FirstOrDefaultAsync(c => c.Id == id && c.Status != ComplaintStatus.Draft, ct);
        if (complaint is null) throw new NotFoundException("Complaint not found.");

        string detail;
        if (req.AssigneeUserId is { } assigneeId)
        {
            var assignee = await _users.FindByIdAsync(assigneeId.ToString());
            if (assignee is null || !await _users.IsInRoleAsync(assignee, Core.Roles.Caseworker))
                throw new ConflictException("That user is not a caseworker.");

            complaint.AssignedToUserId = assignee.Id;
            complaint.AssignedToName = string.IsNullOrWhiteSpace(assignee.FullName) ? assignee.Email : assignee.FullName;
            detail = $"Assigned to {complaint.AssignedToName}";
        }
        else
        {
            complaint.AssignedToUserId = null;
            complaint.AssignedToName = null;
            detail = "Unassigned";
        }

        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditEvents.ComplaintAssigned, _current.UserId, detail, "Complaint", id.ToString(), ct);
        return ToCaseworkerDetail(complaint);
    }

    public async Task<List<CaseworkerOptionDto>> ListCaseworkersAsync(CancellationToken ct)
    {
        var caseworkers = await _users.GetUsersInRoleAsync(Core.Roles.Caseworker);
        return caseworkers
            .Select(u => new CaseworkerOptionDto(u.Id, string.IsNullOrWhiteSpace(u.FullName) ? (u.Email ?? "Caseworker") : u.FullName, u.Email))
            .OrderBy(u => u.Name)
            .ToList();
    }

    public async Task<DashboardSummaryDto> GetDashboardAsync(CancellationToken ct)
    {
        var lodged = _db.Complaints.AsNoTracking().Where(c => c.Status != ComplaintStatus.Draft);

        var total = await lodged.CountAsync(ct);
        var byStatusRaw = await lodged.GroupBy(c => c.Status)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync(ct);
        var byGroundRaw = await _db.ComplaintGrounds.AsNoTracking()
            .Where(g => g.Complaint!.Status != ComplaintStatus.Draft)
            .GroupBy(g => g.GroundType)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync(ct);

        var byStatus = byStatusRaw.ToDictionary(x => x.Key.ToString(), x => x.Count);
        var byGround = byGroundRaw.ToDictionary(
            x => GroundCatalog.Find(x.Key)?.Label ?? x.Key.ToString(), x => x.Count);

        var openCount = byStatusRaw
            .Where(x => x.Key is ComplaintStatus.Submitted or ComplaintStatus.UnderReview or ComplaintStatus.MoreInfoNeeded)
            .Sum(x => x.Count);

        return new DashboardSummaryDto(total, openCount, byStatus, byGround);
    }

    public async Task<AnalyticsDto> GetAnalyticsAsync(CancellationToken ct)
    {
        var byGroundRaw = await _db.ComplaintGrounds.AsNoTracking()
            .Where(g => g.Complaint!.Status != ComplaintStatus.Draft)
            .GroupBy(g => g.GroundType)
            .Select(g => new { g.Key, Count = g.Count() }).ToListAsync(ct);

        var byGround = byGroundRaw
            .Select(x =>
            {
                var def = GroundCatalog.Find(x.Key);
                var fallback = x.Key.ToString();
                return new CategoryCountDto(def?.Label ?? fallback, def?.ShortLabel ?? fallback, x.Count);
            })
            .OrderByDescending(x => x.Count).ToList();

        // Last 12 months of submissions, grouped by calendar month.
        var since = DateTime.UtcNow.AddMonths(-11);
        var monthsRaw = await _db.Complaints.AsNoTracking()
            .Where(c => c.SubmittedAt != null && c.SubmittedAt >= since)
            .Select(c => c.SubmittedAt!.Value)
            .ToListAsync(ct);

        var byMonth = Enumerable.Range(0, 12)
            .Select(i => DateTime.UtcNow.AddMonths(-11 + i))
            .Select(d => new MonthCountDto(
                d.ToString("yyyy-MM"),
                monthsRaw.Count(m => m.Year == d.Year && m.Month == d.Month)))
            .ToList();

        return new AnalyticsDto(byGround, byMonth);
    }

    // ----- internals -----

    private IQueryable<Complaint> LoadFull() => _db.Complaints
        .Include(c => c.ComplainantContact)
        .Include(c => c.Respondents)
        .Include(c => c.Grounds)
        .Include(c => c.Attachments)
        .Include(c => c.StatusHistory)
        .Include(c => c.CaseNotes)
        .Include(c => c.OnBehalfOfPerson)
        .Include(c => c.AssistingRepresentative);

    private static CaseworkerComplaintDetailDto ToCaseworkerDetail(Complaint c) => new(
        ComplaintMapping.ToDetail(c),
        c.ComplainantUserId,
        c.CaseNotes.OrderByDescending(n => n.CreatedAt)
            .Select(n => new CaseNoteDto(n.Id, n.AuthorName, n.Body, n.CreatedAt)).ToList());
}

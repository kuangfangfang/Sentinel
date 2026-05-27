using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Sentinel.Api.Dtos;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;
using Sentinel.Core.Entities;
using Sentinel.Core.Enums;
using Sentinel.Core.Services;
using Sentinel.Data;
using Xunit;

namespace Sentinel.Tests;

public class ComplaintServiceTests
{
    private static SentinelDbContext NewDb() =>
        new(new DbContextOptionsBuilder<SentinelDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static ComplaintService NewService(SentinelDbContext db, Guid? currentUserId, params string[] roles) =>
        new(db,
            new FakeCurrentUser(currentUserId, roles),
            new ReferenceCodeGenerator(),
            new StatusTransitionService(),
            new TriageService(),
            new AuditService(db, new HttpContextAccessor()),
            new FakeFileStorage(),
            new FakeVirusScanner(),
            new FileStorageOptions());

    private static ComplaintWriteDto ValidComplaint() => new()
    {
        Title = "Refused a reasonable adjustment",
        Description = "A detailed account of what happened, well over twenty characters long.",
        IncidentDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-7)),
        IncidentLocation = "Sydney, NSW",
        GenAiUsed = false,
        PrivacyNoticeAccepted = true,
        WizardStep = 5,
        Grounds = { new GroundSelectionDto { GroundType = GroundType.Disability, ConditionalDetail = "Vision impairment" } },
        Respondents = { new RespondentDto { Name = "Example Employer Pty Ltd", RelationshipToComplainant = "Employer" } },
    };

    [Fact]
    public async Task A_complainant_cannot_open_another_users_complaint_and_the_attempt_is_logged()
    {
        // AC-8: insecure direct object reference is refused server-side and audited.
        using var db = NewDb();
        var owner = Guid.NewGuid();
        var attacker = Guid.NewGuid();
        var complaint = new Complaint
        {
            ComplainantUserId = owner,
            Title = "Owned by someone else",
            Description = "Belongs to the owner only.",
            Status = ComplaintStatus.Submitted,
            ReferenceCode = "SEN-2026-OWNER1",
        };
        db.Complaints.Add(complaint);
        await db.SaveChangesAsync();

        var service = NewService(db, attacker, Sentinel.Core.Roles.Complainant);

        await service.Invoking(s => s.GetOwnDetailAsync(complaint.Id, default))
            .Should().ThrowAsync<NotFoundException>();

        db.AuditLogs.Should().ContainSingle(a => a.EventType == AuditEvents.ComplaintAccessDenied);
    }

    [Fact]
    public async Task The_owner_can_open_their_own_complaint()
    {
        using var db = NewDb();
        var owner = Guid.NewGuid();
        var complaint = new Complaint
        {
            ComplainantUserId = owner,
            Title = "My complaint",
            Description = "My own account of events.",
            Status = ComplaintStatus.Submitted,
            ReferenceCode = "SEN-2026-MINE01",
        };
        db.Complaints.Add(complaint);
        await db.SaveChangesAsync();

        var service = NewService(db, owner, Sentinel.Core.Roles.Complainant);
        var detail = await service.GetOwnDetailAsync(complaint.Id, default);

        detail.Title.Should().Be("My complaint");
    }

    [Fact]
    public async Task Submitting_a_draft_generates_a_reference_code_and_marks_it_submitted()
    {
        // AC-3: completing the wizard yields a unique reference code.
        using var db = NewDb();
        var userId = Guid.NewGuid();
        var service = NewService(db, userId, Sentinel.Core.Roles.Complainant);

        var draft = await service.CreateDraftAsync(default);
        var result = await service.SubmitAsync(draft.Id, ValidComplaint(), default);

        result.ReferenceCode.Should().StartWith("SEN-");
        result.Status.Should().Be(ComplaintStatus.Submitted);

        var saved = await db.Complaints.Include(c => c.StatusHistory).FirstAsync(c => c.Id == draft.Id);
        saved.Status.Should().Be(ComplaintStatus.Submitted);
        saved.SubmittedAt.Should().NotBeNull();
        saved.Severity.Should().NotBeNull(); // triage hint applied
        saved.StatusHistory.Should().Contain(h =>
            h.FromStatus == ComplaintStatus.Draft && h.ToStatus == ComplaintStatus.Submitted);
    }

    [Fact]
    public async Task An_anonymous_complaint_can_be_lodged_without_an_account()
    {
        // AC-7: anonymous submission produces a trackable reference code, no user link.
        using var db = NewDb();
        var service = NewService(db, currentUserId: null);

        var result = await service.SubmitAnonymousAsync(ValidComplaint(), default);

        result.ReferenceCode.Should().StartWith("SEN-");
        var saved = await db.Complaints.FirstAsync(c => c.Id == result.Id);
        saved.IsAnonymous.Should().BeTrue();
        saved.ComplainantUserId.Should().BeNull();
    }
}

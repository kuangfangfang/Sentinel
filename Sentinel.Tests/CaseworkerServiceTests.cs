using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Api.Dtos;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;
using Sentinel.Core.Entities;
using Sentinel.Core.Enums;
using Sentinel.Core.Services;
using Sentinel.Data;
using Xunit;

namespace Sentinel.Tests;

public class CaseworkerServiceTests
{
    private static SentinelDbContext NewDb() =>
        new(new DbContextOptionsBuilder<SentinelDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static UserManager<ApplicationUser> NewUserManager(SentinelDbContext db)
    {
        var store = new UserStore<ApplicationUser, IdentityRole<Guid>, SentinelDbContext, Guid>(db);
        return new UserManager<ApplicationUser>(
            store,
            Options.Create(new IdentityOptions()),
            new PasswordHasher<ApplicationUser>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            services: null!,
            NullLogger<UserManager<ApplicationUser>>.Instance);
    }

    private static CaseworkerService NewService(SentinelDbContext db, UserManager<ApplicationUser> users, Guid? currentUserId) =>
        new(db,
            new FakeCurrentUser(currentUserId, Sentinel.Core.Roles.Caseworker),
            new StatusTransitionService(),
            new AuditService(db, new HttpContextAccessor()),
            users);

    private static async Task<ApplicationUser> SeedUserAsync(
        SentinelDbContext db, UserManager<ApplicationUser> users, string fullName, string? role)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"{Guid.NewGuid():N}@sentinel.local",
            Email = $"{Guid.NewGuid():N}@sentinel.local",
            FullName = fullName,
        };
        await users.CreateAsync(user);

        if (role is not null)
        {
            var normalized = role.ToUpperInvariant();
            var roleRow = await db.Roles.FirstOrDefaultAsync(r => r.NormalizedName == normalized);
            if (roleRow is null)
            {
                roleRow = new IdentityRole<Guid> { Id = Guid.NewGuid(), Name = role, NormalizedName = normalized };
                db.Roles.Add(roleRow);
                await db.SaveChangesAsync();
            }
            db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = user.Id, RoleId = roleRow.Id });
            await db.SaveChangesAsync();
        }

        return user;
    }

    private static async Task<Complaint> SeedComplaintAsync(SentinelDbContext db)
    {
        var complaint = new Complaint
        {
            Title = "A lodged complaint",
            Description = "An account of what happened, well over twenty characters long.",
            Status = ComplaintStatus.Submitted,
            ReferenceCode = "SEN-2026-ASSIGN",
        };
        db.Complaints.Add(complaint);
        await db.SaveChangesAsync();
        return complaint;
    }

    [Fact]
    public async Task Assigning_to_a_caseworker_records_the_assignee_and_audits_it()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var caseworker = await SeedUserAsync(db, users, "Dana Field", Sentinel.Core.Roles.Caseworker);
        var complaint = await SeedComplaintAsync(db);
        var service = NewService(db, users, currentUserId: caseworker.Id);

        var result = await service.AssignAsync(complaint.Id, new AssignRequest { AssigneeUserId = caseworker.Id }, default);

        result.Complaint.AssignedToUserId.Should().Be(caseworker.Id);
        result.Complaint.AssignedToName.Should().Be("Dana Field");
        db.AuditLogs.Should().ContainSingle(a => a.EventType == AuditEvents.ComplaintAssigned);
    }

    [Fact]
    public async Task Assigning_with_a_null_assignee_clears_the_assignment()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var caseworker = await SeedUserAsync(db, users, "Dana Field", Sentinel.Core.Roles.Caseworker);
        var complaint = await SeedComplaintAsync(db);
        complaint.AssignedToUserId = caseworker.Id;
        complaint.AssignedToName = "Dana Field";
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: caseworker.Id);

        var result = await service.AssignAsync(complaint.Id, new AssignRequest { AssigneeUserId = null }, default);

        result.Complaint.AssignedToUserId.Should().BeNull();
        result.Complaint.AssignedToName.Should().BeNull();
    }

    [Fact]
    public async Task Assigning_to_a_user_who_is_not_a_caseworker_is_rejected()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var complainant = await SeedUserAsync(db, users, "Sam Rivers", Sentinel.Core.Roles.Complainant);
        var complaint = await SeedComplaintAsync(db);
        var service = NewService(db, users, currentUserId: Guid.NewGuid());

        await service.Invoking(s => s.AssignAsync(complaint.Id, new AssignRequest { AssigneeUserId = complainant.Id }, default))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task The_queue_can_be_filtered_to_unassigned_complaints()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var caseworker = await SeedUserAsync(db, users, "Dana Field", Sentinel.Core.Roles.Caseworker);
        var assigned = await SeedComplaintAsync(db);
        assigned.AssignedToUserId = caseworker.Id;
        assigned.AssignedToName = "Dana Field";
        db.Complaints.Add(new Complaint
        {
            Title = "Unassigned complaint",
            Description = "Another account of events, well over twenty characters long.",
            Status = ComplaintStatus.Submitted,
            ReferenceCode = "SEN-2026-UNASSN",
        });
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: caseworker.Id);

        var result = await service.GetQueueAsync(new QueueQuery { Unassigned = true }, default);

        result.Items.Should().OnlyContain(i => i.AssignedToUserId == null);
        result.Items.Should().ContainSingle();
    }

    [Fact]
    public async Task The_queue_can_be_filtered_to_open_complaints_only()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        db.Complaints.AddRange(
            new Complaint { Title = "Open", Description = "An open complaint account.", Status = ComplaintStatus.Submitted, ReferenceCode = "SEN-OPEN1" },
            new Complaint { Title = "Resolved", Description = "A resolved complaint account.", Status = ComplaintStatus.Resolved, ReferenceCode = "SEN-RES01" },
            new Complaint { Title = "Closed", Description = "A closed complaint account.", Status = ComplaintStatus.Closed, ReferenceCode = "SEN-CLS01" });
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: Guid.NewGuid());

        var result = await service.GetQueueAsync(new QueueQuery { OpenOnly = true }, default);

        result.Items.Should().ContainSingle();
        result.Items.Should().OnlyContain(i =>
            i.Status == ComplaintStatus.Submitted
            || i.Status == ComplaintStatus.UnderReview
            || i.Status == ComplaintStatus.MoreInfoNeeded);
    }

    [Fact]
    public async Task The_queue_can_be_filtered_to_high_severity_only()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        db.Complaints.AddRange(
            new Complaint { Title = "Low", Description = "Low severity open.", Status = ComplaintStatus.Submitted, Severity = Severity.Low, ReferenceCode = "SEN-LOW01" },
            new Complaint { Title = "High", Description = "High severity open.", Status = ComplaintStatus.UnderReview, Severity = Severity.High, ReferenceCode = "SEN-HIG01" },
            new Complaint { Title = "Critical", Description = "Critical severity open.", Status = ComplaintStatus.MoreInfoNeeded, Severity = Severity.Critical, ReferenceCode = "SEN-CRT01" },
            new Complaint { Title = "Resolved high", Description = "Resolved high.", Status = ComplaintStatus.Resolved, Severity = Severity.High, ReferenceCode = "SEN-RHI01" });
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: Guid.NewGuid());

        var result = await service.GetQueueAsync(new QueueQuery { OpenOnly = true, HighSeverityOnly = true }, default);

        result.Items.Should().HaveCount(2);
        result.Items.Should().OnlyContain(i =>
            (i.Severity == Severity.High || i.Severity == Severity.Critical)
            && (i.Status == ComplaintStatus.Submitted
                || i.Status == ComplaintStatus.UnderReview
                || i.Status == ComplaintStatus.MoreInfoNeeded));
    }

    [Fact]
    public async Task The_queue_can_be_filtered_by_aging_days()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var now = DateTime.UtcNow;
        db.Complaints.AddRange(
            new Complaint { Title = "Recent", Description = "Recent open.", Status = ComplaintStatus.Submitted, SubmittedAt = now.AddDays(-5), ReferenceCode = "SEN-REC01" },
            new Complaint { Title = "Aging", Description = "Aging open.", Status = ComplaintStatus.UnderReview, SubmittedAt = now.AddDays(-40), ReferenceCode = "SEN-AGE01" });
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: Guid.NewGuid());

        var result = await service.GetQueueAsync(new QueueQuery { OpenOnly = true, AgingDays = 30 }, default);

        result.Items.Should().ContainSingle();
        result.Items[0].Title.Should().Be("Aging");
    }

    [Fact]
    public async Task Dashboard_counts_reflect_open_unassigned_aging_and_severity()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var me = await SeedUserAsync(db, users, "Dana Field", Sentinel.Core.Roles.Caseworker);
        var now = DateTime.UtcNow;

        db.Complaints.AddRange(
            new Complaint { Title = "A", Description = "Open, unassigned, recent, low.", Status = ComplaintStatus.Submitted, Severity = Severity.Low, SubmittedAt = now.AddDays(-1) },
            new Complaint { Title = "B", Description = "Open, mine, aging, critical.", Status = ComplaintStatus.UnderReview, Severity = Severity.Critical, SubmittedAt = now.AddDays(-40), AssignedToUserId = me.Id, AssignedToName = "Dana Field" },
            new Complaint { Title = "C", Description = "Awaiting info, mine, high.", Status = ComplaintStatus.MoreInfoNeeded, Severity = Severity.High, SubmittedAt = now.AddDays(-5), AssignedToUserId = me.Id, AssignedToName = "Dana Field" },
            new Complaint { Title = "D", Description = "Resolved, old, not open.", Status = ComplaintStatus.Resolved, Severity = Severity.Medium, SubmittedAt = now.AddDays(-50) });
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: me.Id);

        var dash = await service.GetDashboardAsync(default);

        dash.Total.Should().Be(4);
        dash.OpenCount.Should().Be(3);
        dash.Unassigned.Should().Be(1);
        dash.AssignedToMeOpen.Should().Be(2);
        dash.MyAwaitingInfo.Should().Be(1);
        dash.AgingOpen.Should().Be(1);
        dash.HighSeverityOpen.Should().Be(2);
        dash.BySeverity["Critical"].Should().Be(1);
    }

    [Fact]
    public async Task Analytics_counts_each_complaint_resolved_in_a_month_once()
    {
        using var db = NewDb();
        var users = NewUserManager(db);
        var complaint = await SeedComplaintAsync(db);
        var now = DateTime.UtcNow;
        db.StatusHistories.AddRange(
            new StatusHistory { ComplaintId = complaint.Id, FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.Resolved, ChangedAt = now },
            new StatusHistory { ComplaintId = complaint.Id, FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.Resolved, ChangedAt = now.AddHours(-1) });
        await db.SaveChangesAsync();
        var service = NewService(db, users, currentUserId: Guid.NewGuid());

        var analytics = await service.GetAnalyticsAsync(default);

        var thisMonth = analytics.ByMonth.Single(m => m.Month == now.ToString("yyyy-MM"));
        thisMonth.Resolved.Should().Be(1);
    }
}

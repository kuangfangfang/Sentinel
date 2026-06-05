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
}

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sentinel.Core.Entities;

namespace Sentinel.Data;

/// <summary>
/// EF Core context. Inherits from IdentityDbContext so it carries the Identity
/// user/role/login tables alongside the Sentinel domain tables.
/// </summary>
public class SentinelDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public SentinelDbContext(DbContextOptions<SentinelDbContext> options) : base(options) { }

    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<Respondent> Respondents => Set<Respondent>();
    public DbSet<ComplaintGround> ComplaintGrounds => Set<ComplaintGround>();
    public DbSet<OnBehalfOfPerson> OnBehalfOfPersons => Set<OnBehalfOfPerson>();
    public DbSet<AssistingRepresentative> AssistingRepresentatives => Set<AssistingRepresentative>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<CaseNote> CaseNotes => Set<CaseNote>();
    public DbSet<StatusHistory> StatusHistories => Set<StatusHistory>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ResourceLink> ResourceLinks => Set<ResourceLink>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Complaint>(e =>
        {
            e.Property(c => c.Title).HasMaxLength(150).IsRequired();
            e.Property(c => c.IncidentLocation).HasMaxLength(200);
            e.Property(c => c.PreferredLanguage).HasMaxLength(60);
            e.Property(c => c.ReferenceCode).HasMaxLength(30);

            // Indexes to keep the caseworker queue fast (SRS 5.4, NFR-2).
            e.HasIndex(c => c.Status);
            e.HasIndex(c => c.Severity);
            e.HasIndex(c => c.IncidentDate);
            e.HasIndex(c => c.ComplainantUserId);

            // Cascade deletes from a complaint to its child records (SRS 5.4).
            e.HasMany(c => c.Respondents).WithOne(r => r.Complaint!)
                .HasForeignKey(r => r.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Grounds).WithOne(g => g.Complaint!)
                .HasForeignKey(g => g.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Attachments).WithOne(a => a.Complaint!)
                .HasForeignKey(a => a.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.CaseNotes).WithOne(n => n.Complaint!)
                .HasForeignKey(n => n.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.StatusHistory).WithOne(s => s.Complaint!)
                .HasForeignKey(s => s.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.OnBehalfOfPerson).WithOne(o => o.Complaint!)
                .HasForeignKey<OnBehalfOfPerson>(o => o.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.AssistingRepresentative).WithOne(a => a.Complaint!)
                .HasForeignKey<AssistingRepresentative>(a => a.ComplaintId).OnDelete(DeleteBehavior.Cascade);

            // Enums stored as integers with a documented mapping (SRS 5.4).
            e.Property(c => c.Status).HasConversion<int>();
            e.Property(c => c.Severity).HasConversion<int>();
        });

        // Unique index on ReferenceCode (SRS 5.4). Filtered to non-null so the many
        // draft complaints (which have no code yet) do not collide. Filter SQL is
        // provider-specific, so it is chosen by the active provider.
        var refIndex = b.Entity<Complaint>().HasIndex(c => c.ReferenceCode).IsUnique();
        if (Database.IsSqlite())
            refIndex.HasFilter("\"ReferenceCode\" IS NOT NULL");
        else if (Database.IsSqlServer())
            refIndex.HasFilter("[ReferenceCode] IS NOT NULL");

        b.Entity<Respondent>(e =>
        {
            e.Property(r => r.Name).HasMaxLength(200).IsRequired();
            e.Property(r => r.AbnAcn).HasMaxLength(20);
            e.Property(r => r.RelationshipToComplainant).HasMaxLength(200);
        });

        b.Entity<ComplaintGround>(e =>
        {
            e.Property(g => g.ConditionalDetail).HasMaxLength(300);
            e.Property(g => g.GroundType).HasConversion<int>();
        });

        b.Entity<Attachment>(e => e.Property(a => a.ScanStatus).HasConversion<int>());

        b.Entity<CaseNote>(e => e.Property(n => n.Body).IsRequired());

        b.Entity<StatusHistory>(e =>
        {
            e.Property(s => s.FromStatus).HasConversion<int>();
            e.Property(s => s.ToStatus).HasConversion<int>();
            e.HasIndex(s => s.ChangedAt);
        });

        b.Entity<AuditLog>(e =>
        {
            e.Property(a => a.EventType).HasMaxLength(80).IsRequired();
            e.HasIndex(a => a.CreatedAt);
        });

        b.Entity<ResourceLink>(e =>
        {
            e.Property(r => r.Name).HasMaxLength(150).IsRequired();
            e.Property(r => r.Category).HasMaxLength(60).IsRequired();
        });
    }
}

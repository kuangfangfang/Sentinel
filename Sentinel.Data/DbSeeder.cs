using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sentinel.Core;
using Sentinel.Core.Entities;
using Sentinel.Core.Enums;

namespace Sentinel.Data;

/// <summary>
/// Inserts clearly fictional seed data (SRS build-safety note): the two roles,
/// one caseworker and one complainant demo account, the public resources
/// directory, and a few sample complaints. Idempotent — safe to run on every start.
/// </summary>
public static class DbSeeder
{
    // Demo credentials. These are obviously non-real and exist only for local demonstration.
    public const string CaseworkerEmail = "caseworker@sentinel.local";
    public const string CaseworkerPassword = "Caseworker#2026";
    public const string ComplainantEmail = "complainant@sentinel.local";
    public const string ComplainantPassword = "Complainant#2026";

    public static async Task SeedAsync(
        SentinelDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        await db.Database.MigrateAsync();

        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role) { Id = Guid.NewGuid() });
        }

        var caseworker = await EnsureUserAsync(userManager, CaseworkerEmail, "Dana Field (Caseworker)", CaseworkerPassword, Roles.Caseworker);
        var complainant = await EnsureUserAsync(userManager, ComplainantEmail, "Sam Rivers", ComplainantPassword, Roles.Complainant);

        if (!await db.ResourceLinks.AnyAsync())
        {
            db.ResourceLinks.AddRange(
                new ResourceLink { Category = "Emergency", Name = "Emergency (Police/Fire/Ambulance)", PhoneNumber = "000", Description = "If you are in immediate danger, call 000.", DisplayOrder = 1 },
                new ResourceLink { Category = "Crisis support", Name = "Lifeline", PhoneNumber = "13 11 14", Url = "https://www.lifeline.org.au", Description = "24-hour crisis support and suicide prevention.", DisplayOrder = 2 },
                new ResourceLink { Category = "Crisis support", Name = "1800RESPECT", PhoneNumber = "1800 737 732", Url = "https://www.1800respect.org.au", Description = "National domestic, family and sexual violence counselling.", DisplayOrder = 3 },
                new ResourceLink { Category = "Legal aid", Name = "National Legal Aid", Url = "https://www.nationallegalaid.org", Description = "Find free or low-cost legal help in your state or territory.", DisplayOrder = 4 },
                new ResourceLink { Category = "Advocacy", Name = "Disability Advocacy Finder", Url = "https://disabilityadvocacyfinder.dss.gov.au", Description = "Locate a disability advocate near you.", DisplayOrder = 5 },
                new ResourceLink { Category = "Interpreting", Name = "Translating and Interpreting Service (TIS)", PhoneNumber = "131 450", Url = "https://www.tisnational.gov.au", Description = "Free interpreting for people who do not speak English.", DisplayOrder = 6 }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Complaints.AnyAsync())
        {
            var now = DateTime.UtcNow;

            // 1. A submitted complaint owned by the demo complainant.
            var c1 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO01",
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Refused workplace adjustments",
                Description = "I asked my employer for a height-adjustable desk that my doctor recommended. My manager refused and said it was 'too much fuss', then moved me off my main project. I believe I was treated unfairly because of my disability.",
                IncidentDate = new DateOnly(2026, 3, 12),
                IncidentLocation = "Parramatta, NSW",
                DesiredOutcome = "An apology, the equipment I need, and training for managers.",
                Status = ComplaintStatus.Submitted,
                InterpreterRequired = false,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-10),
                WizardStep = 5,
                CreatedAt = now.AddDays(-11),
                SubmittedAt = now.AddDays(-10),
                UpdatedAt = now.AddDays(-10),
                Grounds = { new ComplaintGround { GroundType = GroundType.Disability, ConditionalDetail = "Chronic back injury" } },
                Respondents = { new Respondent { Name = "Brightline Logistics Pty Ltd", AbnAcn = "12 345 678 901", Suburb = "Parramatta", State = "NSW", Postcode = "2150", RelationshipToComplainant = "Employer" } },
            };
            c1.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-10) });

            // 2. An anonymous, submitted complaint — tracked only by its code.
            var c2 = new Complaint
            {
                ReferenceCode = "SEN-2026-ANON77",
                ComplainantUserId = null,
                IsAnonymous = true,
                Title = "Racist abuse on public transport",
                Description = "A staff member repeatedly made comments about my background and told me to 'go back home'. Other passengers heard it. I felt humiliated and unsafe.",
                IncidentDate = new DateOnly(2026, 4, 2),
                IncidentLocation = "Footscray, VIC",
                DesiredOutcome = "Staff training and a public commitment to address racism.",
                Status = ComplaintStatus.UnderReview,
                Severity = Severity.High,
                InterpreterRequired = true,
                PreferredLanguage = "Vietnamese",
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-6),
                WizardStep = 5,
                CreatedAt = now.AddDays(-7),
                SubmittedAt = now.AddDays(-6),
                UpdatedAt = now.AddDays(-3),
                Grounds = { new ComplaintGround { GroundType = GroundType.RacialHatred, ConditionalDetail = "Vietnamese-Australian" } },
                Respondents = { new Respondent { Name = "Metro Transit Services", RelationshipToComplainant = "Service provider" } },
            };
            c2.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-6) });
            c2.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-3), Note = "Opened for review; high priority." });
            c2.CaseNotes.Add(new CaseNote { AuthorUserId = caseworker.Id, AuthorName = caseworker.FullName, Body = "Internal: contacted complainant via reference code channel. Interpreter required (Vietnamese).", CreatedAt = now.AddDays(-3) });

            // 3. A draft the complainant can resume.
            var c3 = new Complaint
            {
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Unfair treatment after parental leave",
                Description = "Started documenting what happened when I returned from parental leave.",
                IncidentLocation = "Brisbane, QLD",
                Status = ComplaintStatus.Draft,
                WizardStep = 3,
                CreatedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1),
                Grounds = { new ComplaintGround { GroundType = GroundType.FamilyResponsibilities } },
            };

            // 4. A resolved complaint, for queue/analytics variety.
            var c4 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO04",
                ComplainantUserId = null,
                IsAnonymous = true,
                Title = "Denied entry with assistance animal",
                Description = "A cafe refused to seat me because I had my assistance dog. I showed them the documentation but they still refused.",
                IncidentDate = new DateOnly(2026, 1, 20),
                IncidentLocation = "Adelaide, SA",
                Status = ComplaintStatus.Resolved,
                Severity = Severity.Medium,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-30),
                WizardStep = 5,
                CreatedAt = now.AddDays(-31),
                SubmittedAt = now.AddDays(-30),
                UpdatedAt = now.AddDays(-9),
                Grounds = { new ComplaintGround { GroundType = GroundType.DisabilityAidOrAssistanceAnimalOrCarer } },
                Respondents = { new Respondent { Name = "Corner Cafe", Suburb = "Adelaide", State = "SA", RelationshipToComplainant = "Business I visited" } },
            };
            c4.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-30) });
            c4.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-20) });
            c4.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.Resolved, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-9), Note = "Business agreed to staff training and an apology." });

            db.Complaints.AddRange(c1, c2, c3, c4);
            await db.SaveChangesAsync();
        }
    }

    private static async Task<ApplicationUser> EnsureUserAsync(
        UserManager<ApplicationUser> userManager, string email, string fullName, string password, string role)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FullName = fullName
            };
            await userManager.CreateAsync(user, password);
        }
        if (!await userManager.IsInRoleAsync(user, role))
            await userManager.AddToRoleAsync(user, role);
        return user;
    }
}

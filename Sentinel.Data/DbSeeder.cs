using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sentinel.Core;
using Sentinel.Core.Entities;
using Sentinel.Core.Enums;

namespace Sentinel.Data;

/// <summary>
/// Inserts roles, the public resources directory, and optional demo or bootstrap data.
/// Idempotent — safe to run on every start.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(
        SentinelDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        SeedOptions options)
    {
        await db.Database.MigrateAsync();

        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role) { Id = Guid.NewGuid() });
        }

        await SeedResourceLinksAsync(db);

        if (options.EnableDemoData && HasDemoCredentials(options))
        {
            var caseworker = await EnsureUserAsync(
                userManager,
                options.DemoCaseworkerEmail!,
                "Dana Field (Caseworker)",
                options.DemoCaseworkerPassword!,
                Roles.Caseworker);
            var complainant = await EnsureUserAsync(
                userManager,
                options.DemoComplainantEmail!,
                "Sam Rivers",
                options.DemoComplainantPassword!,
                Roles.Complainant);
            await SeedDemoComplaintsAsync(db, caseworker, complainant);
            return;
        }

        if (HasBootstrapCaseworker(options))
        {
            await EnsureUserAsync(
                userManager,
                options.BootstrapCaseworkerEmail!,
                options.BootstrapCaseworkerFullName ?? "Sentinel Caseworker",
                options.BootstrapCaseworkerPassword!,
                Roles.Caseworker);
        }
    }

    private static bool HasDemoCredentials(SeedOptions options) =>
        !string.IsNullOrWhiteSpace(options.DemoCaseworkerEmail)
        && !string.IsNullOrWhiteSpace(options.DemoCaseworkerPassword)
        && !string.IsNullOrWhiteSpace(options.DemoComplainantEmail)
        && !string.IsNullOrWhiteSpace(options.DemoComplainantPassword);

    private static bool HasBootstrapCaseworker(SeedOptions options) =>
        !string.IsNullOrWhiteSpace(options.BootstrapCaseworkerEmail)
        && !string.IsNullOrWhiteSpace(options.BootstrapCaseworkerPassword);

    private static async Task SeedResourceLinksAsync(SentinelDbContext db)
    {
        if (await db.ResourceLinks.AnyAsync())
            return;

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

    private static async Task SeedDemoComplaintsAsync(
        SentinelDbContext db,
        ApplicationUser caseworker,
        ApplicationUser complainant)
    {
        // Seed complaints by demo key rather than only when the table is empty, so
        // new demo cases appear in existing local databases without duplicating old ones.
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

            // 5. A deliberately full-coverage registered complaint: on behalf, representative,
            // interpreter, multiple respondents, prior complaint details and caseworker follow-up.
            var c5 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO05",
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Sexual harassment and victimisation after reporting it",
                Description = "I complained internally after a supervisor sent sexual messages, commented on my body and touched my lower back at a work function. After I reported it, my shifts were cut and I was left out of team meetings. I am lodging this for my younger sister, who is scared to deal with the process alone.",
                IncidentDate = new DateOnly(2025, 9, 3),
                IncidentLocation = "Melbourne, VIC",
                DesiredOutcome = "A safe workplace, an apology, compensation for lost shifts, and training for managers.",
                ReferringOrganisation = "Northern Community Legal Centre",
                PriorComplaintMade = true,
                PriorComplaintAgency = "Victorian Equal Opportunity and Human Rights Commission",
                PriorComplaintDate = new DateOnly(2025, 10, 2),
                PriorComplaintStatus = "In progress",
                PriorComplaintOutcome = "The matter has not been finalised yet. They suggested also seeking federal advice.",
                Status = ComplaintStatus.MoreInfoNeeded,
                Severity = Severity.Critical,
                InterpreterRequired = true,
                PreferredLanguage = "Auslan",
                GenAiUsed = true,
                PrivacyNoticeAcceptedAt = now.AddDays(-18),
                WizardStep = 5,
                CreatedAt = now.AddDays(-20),
                SubmittedAt = now.AddDays(-18),
                UpdatedAt = now.AddDays(-2),
                ComplainantContact = new ComplainantContact
                {
                    Title = "Mx",
                    FirstName = "Jordan",
                    LastName = "Lee",
                    AddressLine = "14 Cedar Street",
                    Suburb = "Coburg",
                    State = "VIC",
                    Postcode = "3058",
                    Email = "jordan.lee@example.test",
                    PhoneBh = "0412 345 678",
                    AssistanceRequired = "Please communicate by email first and allow extra time for Auslan interpreting."
                },
                OnBehalfOfPerson = new OnBehalfOfPerson
                {
                    FirstName = "Mia",
                    LastName = "Lee",
                    Email = "mia.lee@example.test",
                    RelationshipToComplainant = "Sister",
                    AssistanceRequired = "Needs a support person present for any interview."
                },
                AssistingRepresentative = new AssistingRepresentative
                {
                    Title = "Ms",
                    FirstName = "Priya",
                    LastName = "Nair",
                    Position = "Solicitor",
                    Organisation = "Northern Community Legal Centre",
                    AddressLine = "90 Help Street",
                    Suburb = "Preston",
                    State = "VIC",
                    Postcode = "3072",
                    Email = "priya.nair@example.test",
                    Mobile = "0499 111 222",
                    AssistanceRequired = "Please copy the representative into written requests."
                },
                Grounds =
                {
                    new ComplaintGround { GroundType = GroundType.SexualHarassment },
                    new ComplaintGround { GroundType = GroundType.Sex, ConditionalDetail = "Female" },
                    new ComplaintGround { GroundType = GroundType.Victimisation },
                },
                Respondents =
                {
                    new Respondent { Name = "Harbour Events Group Pty Ltd", AbnAcn = "98 765 432 109", ContactEmail = "hr@example.test", Mobile = "0400 111 222", AddressLine = "22 Market Lane", Suburb = "Melbourne", State = "VIC", Postcode = "3000", RelationshipToComplainant = "Employer" },
                    new Respondent { Name = "Chris Morton", ContactEmail = "chris.morton@example.test", Mobile = "0400 333 444", AddressLine = "22 Market Lane", Suburb = "Melbourne", State = "VIC", Postcode = "3000", RelationshipToComplainant = "Supervisor" },
                },
            };
            c5.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-18) });
            c5.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-12), Note = "Urgent review due to victimisation and alleged ongoing contact." });
            c5.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.MoreInfoNeeded, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-2), Note = "Requested copies of roster changes and internal complaint emails." });
            c5.CaseNotes.Add(new CaseNote { AuthorUserId = caseworker.Id, AuthorName = caseworker.FullName, Body = "Full-form scenario: interpreter, representative, prior complaint and on-behalf-of details all present.", CreatedAt = now.AddDays(-11) });

            // 6. A brief anonymous complaint with an Age follow-up.
            var c6 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO06",
                ComplainantUserId = null,
                IsAnonymous = true,
                Title = "Age comments at interview",
                Description = "The interviewer said I was probably too old to fit in with the team.",
                IncidentDate = new DateOnly(2026, 5, 5),
                IncidentLocation = "Hobart, TAS",
                DesiredOutcome = "I want the employer to review its hiring process.",
                Status = ComplaintStatus.Submitted,
                Severity = Severity.Low,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-2),
                WizardStep = 5,
                CreatedAt = now.AddDays(-2),
                SubmittedAt = now.AddDays(-2),
                UpdatedAt = now.AddDays(-2),
                Grounds = { new ComplaintGround { GroundType = GroundType.Age, ConditionalDetail = "58" } },
                Respondents = { new Respondent { Name = "Tasman Tech Support", RelationshipToComplainant = "Prospective employer", Suburb = "Hobart", State = "TAS", Postcode = "7000" } },
            };
            c6.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-2) });

            // 7. A closed pregnancy discrimination complaint with finalised prior complaint details.
            var c7 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO07",
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Promotion withdrawn after pregnancy announcement",
                Description = "My manager had told me I was the preferred candidate for a team leader role. After I told them I was pregnant, the role was given to someone else and I was told it would be too stressful for me.",
                IncidentDate = new DateOnly(2025, 12, 4),
                IncidentLocation = "Canberra, ACT",
                DesiredOutcome = "Recognition that the decision was discriminatory and a fair opportunity to apply again.",
                PriorComplaintMade = true,
                PriorComplaintAgency = "ACT Human Rights Commission",
                PriorComplaintDate = new DateOnly(2025, 12, 15),
                PriorComplaintStatus = "Finalised",
                PriorComplaintFinalisedDate = new DateOnly(2026, 2, 10),
                PriorComplaintOutcome = "Conciliation ended without agreement.",
                Status = ComplaintStatus.Closed,
                Severity = Severity.Medium,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-70),
                WizardStep = 5,
                CreatedAt = now.AddDays(-72),
                SubmittedAt = now.AddDays(-70),
                UpdatedAt = now.AddDays(-5),
                ComplainantContact = new ComplainantContact { Title = "Dr", FirstName = "Ava", LastName = "Chen", AddressLine = "8 Lake Circuit", Suburb = "Belconnen", State = "ACT", Postcode = "2617", Email = "ava.chen@example.test", PhoneBh = "0411 222 333" },
                Grounds = { new ComplaintGround { GroundType = GroundType.Pregnancy } },
                Respondents = { new Respondent { Name = "Capital Health Services", ContactEmail = "people@example.test", AddressLine = "40 Northbourne Avenue", Suburb = "Canberra", State = "ACT", Postcode = "2601", RelationshipToComplainant = "Employer" } },
            };
            c7.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-70) });
            c7.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-62) });
            c7.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.Resolved, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-12), Note = "Employer agreed to review promotion policy and provide written apology." });
            c7.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Resolved, ToStatus = ComplaintStatus.Closed, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-5), Note = "Outcome confirmed by complainant." });

            // 8. A withdrawn employment complaint.
            var c8 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO08",
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Job offer withdrawn after criminal record check",
                Description = "I disclosed an old minor offence that is not related to the role. The employer withdrew the offer without asking me for context or considering the requirements of the job.",
                IncidentDate = new DateOnly(2026, 2, 16),
                IncidentLocation = "Perth, WA",
                DesiredOutcome = "I wanted the employer to reconsider, but I have since accepted another role.",
                Status = ComplaintStatus.Withdrawn,
                Severity = Severity.Low,
                GenAiUsed = true,
                PrivacyNoticeAcceptedAt = now.AddDays(-40),
                WizardStep = 5,
                CreatedAt = now.AddDays(-41),
                SubmittedAt = now.AddDays(-40),
                UpdatedAt = now.AddDays(-14),
                ComplainantContact = new ComplainantContact { FirstName = "Noah", LastName = "Williams", AddressLine = "3 Stirling Road", Suburb = "Perth", State = "WA", Postcode = "6000", Email = "noah.williams@example.test", PhoneBh = "0422 333 444" },
                Grounds = { new ComplaintGround { GroundType = GroundType.EmploymentCriminalRecord, ConditionalDetail = "A spent minor property offence from more than 10 years ago" } },
                Respondents = { new Respondent { Name = "West Coast Security Pty Ltd", AbnAcn = "11 222 333 444", RelationshipToComplainant = "Prospective employer", Suburb = "Perth", State = "WA", Postcode = "6000" } },
            };
            c8.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-40) });
            c8.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.Withdrawn, ChangedByUserId = complainant.Id, ChangedByName = complainant.FullName, ChangedAt = now.AddDays(-14), Note = "Complainant withdrew after finding other employment." });

            // 9. A Commonwealth human rights complaint under review.
            var c9 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO09",
                ComplainantUserId = null,
                IsAnonymous = true,
                Title = "Unable to access an interpreter for a Commonwealth service",
                Description = "I contacted a Commonwealth agency several times and asked for an Arabic interpreter. I was told to call back with an English-speaking family member. I could not understand important information about my application.",
                IncidentDate = new DateOnly(2026, 4, 18),
                IncidentLocation = "Online service centre",
                DesiredOutcome = "Interpreter access and a review of the decision made without proper communication.",
                Status = ComplaintStatus.UnderReview,
                Severity = Severity.High,
                InterpreterRequired = true,
                PreferredLanguage = "Arabic",
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-9),
                WizardStep = 5,
                CreatedAt = now.AddDays(-10),
                SubmittedAt = now.AddDays(-9),
                UpdatedAt = now.AddDays(-4),
                Grounds = { new ComplaintGround { GroundType = GroundType.HumanRightsBreachByCommonwealth } },
                Respondents = { new Respondent { Name = "Commonwealth Service Centre", RelationshipToComplainant = "Government service provider", ContactPhone = "02 9000 1111" } },
            };
            c9.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-9) });
            c9.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-4), Note = "Check jurisdiction and interpreter access records." });
            c9.CaseNotes.Add(new CaseNote { AuthorUserId = caseworker.Id, AuthorName = caseworker.FullName, Body = "Anonymous matter. Interpreter required: Arabic.", CreatedAt = now.AddDays(-4) });

            // 10. A concise breastfeeding discrimination complaint.
            var c10 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO10",
                ComplainantUserId = null,
                IsAnonymous = true,
                Title = "Asked to leave while breastfeeding",
                Description = "A restaurant worker told me to breastfeed in the toilet or leave. I left because I felt embarrassed.",
                IncidentDate = new DateOnly(2026, 5, 21),
                IncidentLocation = "Darwin, NT",
                DesiredOutcome = "An apology and staff training.",
                Status = ComplaintStatus.Submitted,
                Severity = Severity.Low,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-1),
                WizardStep = 5,
                CreatedAt = now.AddDays(-1),
                SubmittedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1),
                Grounds = { new ComplaintGround { GroundType = GroundType.Breastfeeding } },
                Respondents = { new Respondent { Name = "Top End Family Bistro", RelationshipToComplainant = "Restaurant I visited", Suburb = "Darwin", State = "NT", Postcode = "0800" } },
            };
            c10.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-1) });

            // 11. A gender identity and sexual orientation matter waiting on more information.
            var c11 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO11",
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Gym membership cancelled after complaint about misgendering",
                Description = "Staff repeatedly used the wrong name and pronouns after I corrected them. When I complained, my membership was cancelled and I was told I made other customers uncomfortable.",
                IncidentDate = new DateOnly(2026, 3, 28),
                IncidentLocation = "Newcastle, NSW",
                DesiredOutcome = "Reinstatement, an apology, and inclusive customer service training.",
                Status = ComplaintStatus.MoreInfoNeeded,
                Severity = Severity.Medium,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-25),
                WizardStep = 5,
                CreatedAt = now.AddDays(-26),
                SubmittedAt = now.AddDays(-25),
                UpdatedAt = now.AddDays(-6),
                ComplainantContact = new ComplainantContact { FirstName = "Taylor", LastName = "Morgan", AddressLine = "19 King Street", Suburb = "Newcastle", State = "NSW", Postcode = "2300", Email = "taylor.morgan@example.test", PhoneBh = "0433 444 555", AssistanceRequired = "Please use they/them pronouns in all contact." },
                Grounds =
                {
                    new ComplaintGround { GroundType = GroundType.GenderIdentity, ConditionalDetail = "Non-binary" },
                    new ComplaintGround { GroundType = GroundType.SexualOrientation, ConditionalDetail = "Queer" },
                    new ComplaintGround { GroundType = GroundType.Victimisation },
                },
                Respondents = { new Respondent { Name = "Active Harbour Gym", ContactEmail = "manager@example.test", AddressLine = "5 Wharf Road", Suburb = "Newcastle", State = "NSW", Postcode = "2300", RelationshipToComplainant = "Service provider" } },
            };
            c11.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-25) });
            c11.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-20) });
            c11.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.MoreInfoNeeded, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-6), Note = "Requested membership cancellation email." });

            // 12. A resolved family responsibilities complaint.
            var c12 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO12",
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Roster changed after asking for carer-friendly hours",
                Description = "I asked to keep my existing roster so I could care for my father. My manager changed me to late shifts and said caring responsibilities were not their problem.",
                IncidentDate = new DateOnly(2026, 2, 1),
                IncidentLocation = "Launceston, TAS",
                DesiredOutcome = "A stable roster and a written policy about carers.",
                Status = ComplaintStatus.Resolved,
                Severity = Severity.Medium,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-50),
                WizardStep = 5,
                CreatedAt = now.AddDays(-52),
                SubmittedAt = now.AddDays(-50),
                UpdatedAt = now.AddDays(-7),
                ComplainantContact = new ComplainantContact { FirstName = "Grace", LastName = "Miller", AddressLine = "71 Tamar Street", Suburb = "Launceston", State = "TAS", Postcode = "7250", Email = "grace.miller@example.test", PhoneBh = "0444 555 666" },
                Grounds = { new ComplaintGround { GroundType = GroundType.FamilyResponsibilities } },
                Respondents = { new Respondent { Name = "Northern Fresh Foods", RelationshipToComplainant = "Employer", Suburb = "Launceston", State = "TAS", Postcode = "7250" } },
            };
            c12.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-50) });
            c12.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Submitted, ToStatus = ComplaintStatus.UnderReview, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-45) });
            c12.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.UnderReview, ToStatus = ComplaintStatus.Resolved, ChangedByUserId = caseworker.Id, ChangedByName = caseworker.FullName, ChangedAt = now.AddDays(-7), Note = "Employer agreed to restore roster and review flexible work training." });

            // 13. A detailed draft at step 4 to exercise resume and prior-complaint fields.
            var c13 = new Complaint
            {
                ComplainantUserId = complainant.Id,
                IsAnonymous = false,
                Title = "Accessibility issue at a training provider",
                Description = "Draft complaint about a course provider refusing captioned materials and accessible assessment adjustments.",
                IncidentDate = new DateOnly(2026, 5, 8),
                IncidentLocation = "Geelong, VIC",
                DesiredOutcome = "Accessible course materials and a reasonable adjustment plan.",
                PriorComplaintMade = true,
                PriorComplaintAgency = "Victorian Equal Opportunity and Human Rights Commission",
                PriorComplaintDate = new DateOnly(2026, 5, 15),
                PriorComplaintStatus = "In progress",
                ReferringOrganisation = "Disability advocacy service",
                Status = ComplaintStatus.Draft,
                Severity = Severity.Medium,
                InterpreterRequired = true,
                PreferredLanguage = "English captions",
                GenAiUsed = null,
                WizardStep = 4,
                CreatedAt = now.AddHours(-20),
                UpdatedAt = now.AddHours(-2),
                ComplainantContact = new ComplainantContact { FirstName = "Riley", LastName = "Patel", AddressLine = "2 Bay Road", Suburb = "Geelong", State = "VIC", Postcode = "3220", Email = "riley.patel@example.test", PhoneBh = "0455 666 777", AssistanceRequired = "Needs captions for video meetings." },
                Grounds = { new ComplaintGround { GroundType = GroundType.Disability, ConditionalDetail = "Hearing impairment" } },
                Respondents = { new Respondent { Name = "Skills Pathway College", ContactEmail = "admin@example.test", Suburb = "Geelong", State = "VIC", Postcode = "3220", RelationshipToComplainant = "Education provider" } },
            };
            c13.StatusHistory.Add(new StatusHistory { FromStatus = null, ToStatus = ComplaintStatus.Draft, ChangedByUserId = complainant.Id, ChangedByName = complainant.FullName, ChangedAt = now.AddHours(-20) });

            // 14. An anonymous intersex status complaint with minimal contact surface.
            var c14 = new Complaint
            {
                ReferenceCode = "SEN-2026-DEMO14",
                ComplainantUserId = null,
                IsAnonymous = true,
                Title = "Club form required unnecessary sex characteristics information",
                Description = "A local sports club required me to provide unnecessary information about my sex characteristics before I could register. I felt singled out and withdrew my application.",
                IncidentDate = new DateOnly(2026, 4, 30),
                IncidentLocation = "Wollongong, NSW",
                DesiredOutcome = "The club should change its registration form and privacy practices.",
                Status = ComplaintStatus.Submitted,
                Severity = Severity.Medium,
                GenAiUsed = false,
                PrivacyNoticeAcceptedAt = now.AddDays(-5),
                WizardStep = 5,
                CreatedAt = now.AddDays(-5),
                SubmittedAt = now.AddDays(-5),
                UpdatedAt = now.AddDays(-5),
                Grounds = { new ComplaintGround { GroundType = GroundType.IntersexStatus } },
                Respondents = { new Respondent { Name = "Illawarra Community Sports Club", RelationshipToComplainant = "Club I tried to join", Suburb = "Wollongong", State = "NSW", Postcode = "2500" } },
            };
            c14.StatusHistory.Add(new StatusHistory { FromStatus = ComplaintStatus.Draft, ToStatus = ComplaintStatus.Submitted, ChangedAt = now.AddDays(-5) });

            var seededComplaints = new[] { c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14 };
            var existingDemoKeys = await db.Complaints
                .Select(c => c.ReferenceCode ?? c.Title)
                .ToListAsync();
            var missingComplaints = seededComplaints
                .Where(c => !existingDemoKeys.Contains(c.ReferenceCode ?? c.Title))
                .ToList();

        if (missingComplaints.Count > 0)
        {
            db.Complaints.AddRange(missingComplaints);
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

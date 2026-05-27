using Sentinel.Core.Enums;

namespace Sentinel.Core.Services;

/// <summary>Display metadata for a ground of complaint.</summary>
public record GroundDefinition(
    GroundType Type,
    string Group,
    string Label,
    bool RequiresDetail,
    string? DetailPrompt);

/// <summary>
/// The catalogue of AHRC grounds with their grouping, labels and the conditional
/// follow-up prompt the official form asks (AHRC form Part C, FR-17).
/// Single source of truth shared by the API reference endpoint and the frontend.
/// </summary>
public static class GroundCatalog
{
    public static readonly IReadOnlyList<GroundDefinition> All = new List<GroundDefinition>
    {
        new(GroundType.Age, "Discrimination", "Age", true, "What is your age?"),
        new(GroundType.Disability, "Discrimination", "Disability", true, "What is your disability?"),
        new(GroundType.AssociationWithDisability, "Discrimination", "Association with a person with a disability", true, "What is the person's disability?"),
        new(GroundType.DisabilityAidOrAssistanceAnimalOrCarer, "Discrimination", "Use of an assistance animal, disability aid, or having a carer", false, null),
        new(GroundType.Sex, "Discrimination", "Sex", true, "What is your sex?"),
        new(GroundType.Pregnancy, "Discrimination", "Pregnancy", false, null),
        new(GroundType.Breastfeeding, "Discrimination", "Breastfeeding", false, null),
        new(GroundType.MaritalOrRelationshipStatus, "Discrimination", "Marital or relationship status", true, "What is your marital or relationship status?"),
        new(GroundType.FamilyResponsibilities, "Discrimination", "Family responsibilities", false, null),
        new(GroundType.SexualOrientation, "Discrimination", "Sexual orientation", true, "What is your sexual orientation?"),
        new(GroundType.GenderIdentity, "Discrimination", "Gender identity", true, "What is your gender identity?"),
        new(GroundType.IntersexStatus, "Discrimination", "Intersex status", false, null),
        new(GroundType.Race, "Discrimination", "Race (incl. ethnic/national origin, descent or colour)", true, "What is your race, ethnic origin, national origin, descent or colour?"),
        new(GroundType.SexualHarassment, "Harassment", "I have been sexually harassed", false, null),
        new(GroundType.SexBasedHarassment, "Harassment", "I have experienced sex-based harassment", false, null),
        new(GroundType.HostileWorkplaceOnGroundOfSex, "Harassment", "I have been subjected to a hostile workplace on the ground of sex", false, null),
        new(GroundType.RacialHatred, "Racial hatred", "I have experienced racial hatred", true, "What is your race, ethnic origin, national origin, descent or colour?"),
        new(GroundType.EmploymentTradeUnionActivity, "Discrimination in employment", "Trade union activity", false, null),
        new(GroundType.EmploymentCriminalRecord, "Discrimination in employment", "Criminal record", true, "What is your criminal record?"),
        new(GroundType.EmploymentReligion, "Discrimination in employment", "Religion", true, "What is your religion?"),
        new(GroundType.EmploymentPoliticalOpinion, "Discrimination in employment", "Political opinion", true, "What is your political opinion?"),
        new(GroundType.HumanRightsBreachByCommonwealth, "Human rights", "My human rights have been breached by a Commonwealth government body", false, null),
        new(GroundType.Victimisation, "Victimisation", "I have been victimised for making, or trying to make, a complaint", false, null),
    };

    public static GroundDefinition? Find(GroundType type) => All.FirstOrDefault(g => g.Type == type);
}

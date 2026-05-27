namespace Sentinel.Core.Enums;

/// <summary>
/// Grounds of complaint, mirroring the official AHRC complaint form (Part C).
/// Persisted as integers (SRS 5.4). Display metadata lives in
/// <see cref="Sentinel.Core.Services.GroundCatalog"/>.
/// </summary>
public enum GroundType
{
    // Discrimination because of...
    Age = 1,
    Disability = 2,
    AssociationWithDisability = 3,
    DisabilityAidOrAssistanceAnimalOrCarer = 4,
    Sex = 5,
    Pregnancy = 6,
    Breastfeeding = 7,
    MaritalOrRelationshipStatus = 8,
    FamilyResponsibilities = 9,
    SexualOrientation = 10,
    GenderIdentity = 11,
    IntersexStatus = 12,
    Race = 13,

    // Harassment
    SexualHarassment = 14,
    SexBasedHarassment = 15,
    HostileWorkplaceOnGroundOfSex = 16,

    // Racial hatred
    RacialHatred = 17,

    // Discrimination in employment because of...
    EmploymentTradeUnionActivity = 18,
    EmploymentCriminalRecord = 19,
    EmploymentReligion = 20,
    EmploymentPoliticalOpinion = 21,

    // Human rights
    HumanRightsBreachByCommonwealth = 22,

    // Victimisation
    Victimisation = 23
}

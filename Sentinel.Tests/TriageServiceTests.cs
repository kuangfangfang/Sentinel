using FluentAssertions;
using Sentinel.Core.Enums;
using Sentinel.Core.Services;
using Xunit;

namespace Sentinel.Tests;

public class TriageServiceTests
{
    private readonly TriageService _service = new();

    [Fact]
    public void No_grounds_is_low()
        => _service.SuggestSeverity(Array.Empty<GroundType>()).Should().Be(Severity.Low);

    [Fact]
    public void A_single_ordinary_ground_is_low()
        => _service.SuggestSeverity(new[] { GroundType.Age }).Should().Be(Severity.Low);

    [Fact]
    public void Three_or_more_ordinary_grounds_is_medium()
        => _service.SuggestSeverity(new[] { GroundType.Age, GroundType.Pregnancy, GroundType.FamilyResponsibilities })
            .Should().Be(Severity.Medium);

    [Fact]
    public void A_high_priority_ground_is_high()
        => _service.SuggestSeverity(new[] { GroundType.RacialHatred }).Should().Be(Severity.High);

    [Fact]
    public void A_high_priority_ground_with_several_others_is_critical()
        => _service.SuggestSeverity(new[]
        {
            GroundType.SexualHarassment, GroundType.Sex, GroundType.Victimisation,
        }).Should().Be(Severity.Critical);

    [Fact]
    public void Duplicate_grounds_are_collapsed_before_scoring()
        => _service.SuggestSeverity(new[] { GroundType.Age, GroundType.Age, GroundType.Age })
            .Should().Be(Severity.Low);
}

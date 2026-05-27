using FluentAssertions;
using Sentinel.Core.Services;
using Xunit;

namespace Sentinel.Tests;

public class ReferenceCodeGeneratorTests
{
    private readonly ReferenceCodeGenerator _generator = new();

    [Fact]
    public void Generate_uses_the_SEN_year_prefix()
    {
        var code = _generator.Generate(new DateTime(2026, 5, 1));
        code.Should().StartWith("SEN-2026-");
    }

    [Fact]
    public void Generate_produces_a_six_character_random_suffix()
    {
        var code = _generator.Generate(new DateTime(2026, 1, 1));
        var suffix = code.Split('-')[2];
        suffix.Should().HaveLength(6);
    }

    [Fact]
    public void Generate_excludes_ambiguous_characters()
    {
        // Generate many codes and confirm I, L, O, U never appear in the suffix.
        for (var i = 0; i < 500; i++)
        {
            var suffix = _generator.Generate(DateTime.UtcNow).Split('-')[2];
            suffix.Should().NotContainAny("I", "L", "O", "U");
        }
    }

    [Fact]
    public void Generate_is_effectively_unique_across_many_calls()
    {
        var codes = Enumerable.Range(0, 1000)
            .Select(_ => _generator.Generate(DateTime.UtcNow))
            .ToList();

        // 6 chars of 32-symbol alphabet => ~1 billion space; 1000 draws should not collide.
        codes.Distinct().Should().HaveCount(codes.Count);
    }
}

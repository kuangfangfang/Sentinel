using System.ComponentModel.DataAnnotations;

namespace Sentinel.Api.Dtos;

/// <summary>Server-side rule: the incident date must not be in the future (SRS 7.1, AC-5).</summary>
public sealed class NotInFutureAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is null) return ValidationResult.Success;

        var date = value switch
        {
            DateOnly d => d,
            DateTime dt => DateOnly.FromDateTime(dt),
            _ => (DateOnly?)null
        };
        if (date is null) return ValidationResult.Success;

        return date.Value <= DateOnly.FromDateTime(DateTime.Today)
            ? ValidationResult.Success
            : new ValidationResult(ErrorMessage ?? "The date must not be in the future.",
                new[] { context.MemberName ?? string.Empty });
    }
}

/// <summary>Server-side rule: a boolean consent box must be ticked (FR-20, privacy notice).</summary>
public sealed class MustBeTrueAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
        => value is true
            ? ValidationResult.Success
            : new ValidationResult(ErrorMessage ?? "This must be accepted.",
                new[] { context.MemberName ?? string.Empty });
}

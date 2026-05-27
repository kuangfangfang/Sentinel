using Sentinel.Core.Enums;

namespace Sentinel.Api.Dtos;

/// <summary>A ground of complaint for the wizard's selection step (FR-17).</summary>
public record GroundDto(GroundType Type, string Value, string Group, string Label, bool RequiresDetail, string? DetailPrompt);

/// <summary>A public Resources directory entry (FR-2).</summary>
public record ResourceDto(Guid Id, string Category, string Name, string? Description, string? Url, string? PhoneNumber);

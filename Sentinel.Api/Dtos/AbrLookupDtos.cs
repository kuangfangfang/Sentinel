namespace Sentinel.Api.Dtos;

public record AbnLookupResultDto(
    bool LookupAvailable,
    bool IsVerified,
    string? EntityName,
    string? Message);

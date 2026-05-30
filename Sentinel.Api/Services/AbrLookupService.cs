using System.Text.Json;
using Microsoft.Extensions.Options;
using Sentinel.Api.Dtos;

namespace Sentinel.Api.Services;

public class AbrLookupOptions
{
    public string? Guid { get; init; }
}

public class AbrLookupService
{
    private const string CallbackName = "sentinelAbrCallback";

    private readonly HttpClient _http;
    private readonly AbrLookupOptions _options;
    private readonly ILogger<AbrLookupService> _logger;

    public AbrLookupService(HttpClient http, IOptions<AbrLookupOptions> options, ILogger<AbrLookupService> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AbnLookupResultDto> LookupAsync(string abn, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.Guid))
            return new(false, false, null, "Online ABN verification is unavailable right now.");

        var url =
            $"https://abr.business.gov.au/json/AbnDetails.aspx?abn={Uri.EscapeDataString(abn)}&guid={Uri.EscapeDataString(_options.Guid)}&callback={CallbackName}";

        try
        {
            using var response = await _http.GetAsync(url, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ABN lookup HTTP {StatusCode} for {Abn}.", (int)response.StatusCode, abn);
                return new(true, false, null, "ABN could not be verified. Please double-check.");
            }

            var json = UnwrapJsonp(body);
            if (json is null)
            {
                _logger.LogWarning("ABN lookup returned an unexpected payload for {Abn}.", abn);
                return new(false, false, null, "Online ABN verification is unavailable right now.");
            }

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (TryGetString(root, out var exceptionDescription,
                    "exception.exceptionDescription",
                    "Exception.ExceptionDescription",
                    "exceptionDescription",
                    "ExceptionDescription",
                    "Message"))
            {
                _logger.LogInformation("ABN lookup exception for {Abn}: {Description}", abn, exceptionDescription);
                return new(true, false, null, "ABN could not be verified. Please double-check.");
            }

            var status = GetString(root,
                "businessEntity.entityStatus.entityStatusCode",
                "BusinessEntity.EntityStatus.EntityStatusCode",
                "AbnStatus",
                "ABNStatus");

            var entityName = GetString(root,
                "businessEntity.mainName.organisationName",
                "BusinessEntity.MainName.OrganisationName",
                "EntityName",
                "entityName")
                ?? BuildLegalName(root);

            var isActive = !string.IsNullOrWhiteSpace(status) &&
                           (status.StartsWith("Active", StringComparison.OrdinalIgnoreCase) ||
                            status.Equals("ACTV", StringComparison.OrdinalIgnoreCase));

            if (!isActive || string.IsNullOrWhiteSpace(entityName))
                return new(true, false, null, "ABN could not be verified. Please double-check.");

            return new(true, true, entityName, null);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return new(true, false, null, "ABN could not be verified. Please double-check.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ABN lookup failed for {Abn}.", abn);
            return new(false, false, null, "Online ABN verification is unavailable right now.");
        }
    }

    private static string? UnwrapJsonp(string payload)
    {
        var prefix = $"{CallbackName}(";
        payload = payload.Trim();
        if (payload.EndsWith(";", StringComparison.Ordinal))
            payload = payload[..^1];
        if (!payload.StartsWith(prefix, StringComparison.Ordinal) || !payload.EndsWith(")", StringComparison.Ordinal))
            return null;
        return payload[prefix.Length..^1];
    }

    private static string? BuildLegalName(JsonElement root)
    {
        var given = GetString(root,
            "businessEntity.legalName.givenName",
            "BusinessEntity.LegalName.GivenName");
        var other = GetString(root,
            "businessEntity.legalName.otherGivenName",
            "BusinessEntity.LegalName.OtherGivenName");
        var family = GetString(root,
            "businessEntity.legalName.familyName",
            "BusinessEntity.LegalName.FamilyName");

        var parts = new[] { given, other, family }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim());

        var joined = string.Join(" ", parts);
        return string.IsNullOrWhiteSpace(joined) ? null : joined;
    }

    private static string? GetString(JsonElement root, params string[] paths)
    {
        return TryGetString(root, out var value, paths) ? value : null;
    }

    private static bool TryGetString(JsonElement root, out string value, params string[] paths)
    {
        foreach (var path in paths)
        {
            if (TryGetString(root, path, out value))
                return true;
        }

        value = string.Empty;
        return false;
    }

    private static bool TryGetString(JsonElement root, string path, out string value)
    {
        var current = root;
        foreach (var segment in path.Split('.'))
        {
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(segment, out current))
            {
                value = string.Empty;
                return false;
            }
        }

        if (current.ValueKind == JsonValueKind.String)
        {
            value = current.GetString() ?? string.Empty;
            return !string.IsNullOrWhiteSpace(value);
        }

        value = string.Empty;
        return false;
    }
}

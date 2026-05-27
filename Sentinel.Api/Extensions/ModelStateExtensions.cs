using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Sentinel.Api.Extensions;

public static class ModelStateExtensions
{
    /// <summary>Flattens ModelState into a field -> messages map for the standard ApiError shape.</summary>
    public static IReadOnlyDictionary<string, string[]> ToErrorDictionary(this ModelStateDictionary modelState) =>
        modelState
            .Where(kv => kv.Value is { Errors.Count: > 0 })
            .ToDictionary(
                kv => kv.Key,
                kv => kv.Value!.Errors.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage)
                    ? "Invalid value."
                    : e.ErrorMessage).ToArray());
}

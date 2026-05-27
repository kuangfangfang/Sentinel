namespace Sentinel.Api.Dtos;

/// <summary>A page of results for the caseworker queue (SRS NFR-2, FR-30).</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

/// <summary>The clean JSON shape returned for any error (SRS 7.2). Never contains a stack trace.</summary>
public record ApiError(string Message, string? CorrelationId = null, IReadOnlyDictionary<string, string[]>? Errors = null);

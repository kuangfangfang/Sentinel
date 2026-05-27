namespace Sentinel.Api.Middleware;

/// <summary>Expected failures, translated to clean HTTP responses by the exception middleware (SRS 7.2).</summary>
public abstract class ApiException : Exception
{
    public abstract int StatusCode { get; }
    protected ApiException(string message) : base(message) { }
}

public sealed class NotFoundException : ApiException
{
    public override int StatusCode => StatusCodes.Status404NotFound;
    public NotFoundException(string message = "The requested item was not found.") : base(message) { }
}

public sealed class ForbiddenException : ApiException
{
    public override int StatusCode => StatusCodes.Status403Forbidden;
    public ForbiddenException(string message = "You are not allowed to perform this action.") : base(message) { }
}

public sealed class ConflictException : ApiException
{
    public override int StatusCode => StatusCodes.Status409Conflict;
    public ConflictException(string message) : base(message) { }
}

public sealed class AppValidationException : ApiException
{
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public IReadOnlyDictionary<string, string[]> Errors { get; }
    public AppValidationException(IReadOnlyDictionary<string, string[]> errors, string message = "One or more validation errors occurred.")
        : base(message) => Errors = errors;
}

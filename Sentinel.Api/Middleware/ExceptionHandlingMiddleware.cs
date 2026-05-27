using System.Text.Json;
using Sentinel.Api.Dtos;
using Sentinel.Core.Services;

namespace Sentinel.Api.Middleware;

/// <summary>
/// Catches every unhandled exception, logs it with a correlation id, and returns a
/// clean JSON error — never a stack trace (SRS 7.2, AC-13). Expected failures
/// (not-found, forbidden, validation, invalid status transition) map to precise codes.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.TraceIdentifier;
            int status;
            string message;
            IReadOnlyDictionary<string, string[]>? errors = null;

            switch (ex)
            {
                case AppValidationException v:
                    status = v.StatusCode;
                    message = v.Message;
                    errors = v.Errors;
                    break;
                case ApiException api:
                    status = api.StatusCode;
                    message = api.Message;
                    break;
                case InvalidStatusTransitionException ist:
                    status = StatusCodes.Status409Conflict;
                    message = ist.Message;
                    break;
                default:
                    status = StatusCodes.Status500InternalServerError;
                    message = "Something went wrong on our side. Please try again, and quote the reference below if you contact us.";
                    _logger.LogError(ex, "Unhandled exception. CorrelationId={CorrelationId}", correlationId);
                    break;
            }

            if (status < StatusCodes.Status500InternalServerError)
                _logger.LogWarning("Handled {Status} {ExceptionType}: {Message}. CorrelationId={CorrelationId}",
                    status, ex.GetType().Name, ex.Message, correlationId);

            if (context.Response.HasStarted)
                throw;

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            var payload = new ApiError(message, correlationId, errors);
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
        }
    }
}

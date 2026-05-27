using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Api.Dtos;
using Sentinel.Api.Extensions;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;

namespace Sentinel.Api.Controllers;

[ApiController]
[Route("api/tracking")]
public class TrackingController : ControllerBase
{
    private readonly TrackingService _service;
    public TrackingController(TrackingService service) => _service = service;

    /// <summary>
    /// Look up a complaint's status by reference code (FR-27). POST is used so the
    /// code is never placed in a URL or query string (SRS 6.3). Open to anyone.
    /// </summary>
    [HttpPost("status")]
    [AllowAnonymous]
    public async Task<ActionResult<TrackResultDto>> Track(TrackRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());
        return Ok(await _service.TrackAsync(request.ReferenceCode, ct));
    }
}

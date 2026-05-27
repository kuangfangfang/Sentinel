using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Api.Authorization;
using Sentinel.Api.Dtos;
using Sentinel.Api.Extensions;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;

namespace Sentinel.Api.Controllers;

[ApiController]
[Route("api/caseworker")]
[Authorize(Policy = Policies.CaseworkerOnly)] // role enforced server-side on every action (SRS 6.2, FR-8)
public class CaseworkerController : ControllerBase
{
    private readonly CaseworkerService _service;
    public CaseworkerController(CaseworkerService service) => _service = service;

    /// <summary>Summary counts by status and category (FR-29).</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryDto>> Dashboard(CancellationToken ct) =>
        Ok(await _service.GetDashboardAsync(ct));

    /// <summary>Complaints by category and by month for the dashboard chart (FR-36).</summary>
    [HttpGet("analytics")]
    public async Task<ActionResult<AnalyticsDto>> Analytics(CancellationToken ct) =>
        Ok(await _service.GetAnalyticsAsync(ct));

    /// <summary>The triage queue: filter, search, sort, paginate (FR-30, FR-31).</summary>
    [HttpGet("queue")]
    public async Task<ActionResult<PagedResult<QueueItemDto>>> Queue([FromQuery] QueueQuery query, CancellationToken ct) =>
        Ok(await _service.GetQueueAsync(query, ct));

    /// <summary>Full complaint detail including internal case notes (FR-32).</summary>
    [HttpGet("complaints/{id:guid}")]
    public async Task<ActionResult<CaseworkerComplaintDetailDto>> Detail(Guid id, CancellationToken ct) =>
        Ok(await _service.GetDetailAsync(id, ct));

    /// <summary>Move a complaint along its lifecycle; recorded in the status history (FR-33, AC-9).</summary>
    [HttpPost("complaints/{id:guid}/status")]
    public async Task<ActionResult<CaseworkerComplaintDetailDto>> ChangeStatus(Guid id, ChangeStatusRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());
        return Ok(await _service.ChangeStatusAsync(id, request, ct));
    }

    /// <summary>Add an internal, caseworker-only case note (FR-34, AC-10).</summary>
    [HttpPost("complaints/{id:guid}/notes")]
    public async Task<ActionResult<CaseNoteDto>> AddNote(Guid id, AddCaseNoteRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());
        return Ok(await _service.AddNoteAsync(id, request, ct));
    }

    /// <summary>Assign or change the triage severity (FR-35).</summary>
    [HttpPost("complaints/{id:guid}/severity")]
    public async Task<ActionResult<CaseworkerComplaintDetailDto>> SetSeverity(Guid id, SetSeverityRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());
        return Ok(await _service.SetSeverityAsync(id, request, ct));
    }
}

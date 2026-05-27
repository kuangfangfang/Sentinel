using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Api.Authorization;
using Sentinel.Api.Dtos;
using Sentinel.Api.Extensions;
using Sentinel.Api.Middleware;
using Sentinel.Api.Services;
using Sentinel.Core.Services;

namespace Sentinel.Api.Controllers;

[ApiController]
[Route("api/complaints")]
public class ComplaintsController : ControllerBase
{
    private readonly ComplaintService _service;
    public ComplaintsController(ComplaintService service) => _service = service;

    /// <summary>The catalogue of AHRC grounds for the wizard's selection step (FR-17). Public.</summary>
    [HttpGet("grounds")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<GroundDto>> GetGrounds() =>
        Ok(GroundCatalog.All.Select(g => new GroundDto(
            g.Type, g.Type.ToString(), g.Group, g.Label, g.RequiresDetail, g.DetailPrompt)));

    /// <summary>Start a new draft complaint (FR-14).</summary>
    [HttpPost("draft")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    public async Task<ActionResult<CreateDraftResponse>> CreateDraft(CancellationToken ct) =>
        Ok(await _service.CreateDraftAsync(ct));

    /// <summary>Save progress on a draft after a wizard step. Lenient — partial data is allowed (FR-14).</summary>
    [HttpPut("{id:guid}/draft")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    public async Task<IActionResult> SaveDraft(Guid id, ComplaintWriteDto dto, CancellationToken ct)
    {
        await _service.SaveDraftAsync(id, dto, ct);
        return NoContent();
    }

    /// <summary>Lodge an existing draft. Full server-side validation applies (FR-13–FR-22, AC-5).</summary>
    [HttpPost("{id:guid}/submit")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    public async Task<ActionResult<SubmitResultDto>> Submit(Guid id, ComplaintWriteDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());
        return Ok(await _service.SubmitAsync(id, dto, ct));
    }

    /// <summary>Lodge a complaint anonymously in one request — no account link (FR-23, AC-7).</summary>
    [HttpPost("anonymous")]
    [AllowAnonymous]
    public async Task<ActionResult<SubmitResultDto>> SubmitAnonymous(ComplaintWriteDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            throw new AppValidationException(ModelState.ToErrorDictionary());
        return Ok(await _service.SubmitAnonymousAsync(dto, ct));
    }

    /// <summary>List the current user's own complaints (FR-25).</summary>
    [HttpGet("mine")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    public async Task<ActionResult<IReadOnlyList<ComplaintListItemDto>>> Mine(CancellationToken ct) =>
        Ok(await _service.GetMineAsync(ct));

    /// <summary>Full detail of one of the user's own complaints (FR-26). Ownership enforced server-side (AC-8).</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    public async Task<ActionResult<ComplaintDetailDto>> Detail(Guid id, CancellationToken ct) =>
        Ok(await _service.GetOwnDetailAsync(id, ct));

    /// <summary>Delete one of the user's own draft complaints (FR-28).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _service.DeleteOwnDraftAsync(id, ct);
        return NoContent();
    }

    /// <summary>Attach an evidence file to a draft (FR-19, SRS 7.3).</summary>
    [HttpPost("{id:guid}/attachments")]
    [Authorize(Policy = Policies.ComplainantOnly)]
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<ActionResult<AttachmentDto>> Upload(Guid id, IFormFile? file, CancellationToken ct)
    {
        if (file is null)
            throw new ConflictException("No file was provided.");
        return Ok(await _service.AddAttachmentAsync(id, file, ct));
    }

    /// <summary>Download an evidence file. Served only to the owner or a caseworker (SRS 7.3).</summary>
    [HttpGet("{id:guid}/attachments/{attachmentId:guid}")]
    [Authorize]
    public async Task<IActionResult> Download(Guid id, Guid attachmentId, CancellationToken ct)
    {
        var (stream, contentType, fileName) = await _service.OpenAttachmentAsync(id, attachmentId, ct);
        return File(stream, contentType, fileName);
    }
}

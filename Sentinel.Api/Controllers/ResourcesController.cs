using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.Api.Dtos;
using Sentinel.Data;

namespace Sentinel.Api.Controllers;

[ApiController]
[Route("api/resources")]
public class ResourcesController : ControllerBase
{
    private readonly SentinelDbContext _db;
    public ResourcesController(SentinelDbContext db) => _db = db;

    /// <summary>The public Resources directory of help lines and legal aid (FR-2). No account required.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ResourceDto>>> Get(CancellationToken ct)
    {
        var resources = await _db.ResourceLinks.AsNoTracking()
            .Where(r => r.IsActive)
            .OrderBy(r => r.DisplayOrder).ThenBy(r => r.Name)
            .Select(r => new ResourceDto(r.Id, r.Category, r.Name, r.Description, r.Url, r.PhoneNumber))
            .ToListAsync(ct);
        return Ok(resources);
    }
}

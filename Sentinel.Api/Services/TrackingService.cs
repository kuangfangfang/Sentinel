using Microsoft.EntityFrameworkCore;
using Sentinel.Api.Dtos;
using Sentinel.Api.Middleware;
using Sentinel.Core.Enums;
using Sentinel.Data;

namespace Sentinel.Api.Services;

/// <summary>
/// Public reference-code lookup (FR-27). Returns status and the change timeline
/// only — no contact details — so an anonymous complainant can follow progress
/// using just their code.
/// </summary>
public class TrackingService
{
    private readonly SentinelDbContext _db;
    public TrackingService(SentinelDbContext db) => _db = db;

    public async Task<TrackResultDto> TrackAsync(string referenceCode, CancellationToken ct)
    {
        var code = referenceCode.Trim().ToUpperInvariant();
        var complaint = await _db.Complaints.AsNoTracking()
            .Include(c => c.StatusHistory)
            .FirstOrDefaultAsync(c => c.ReferenceCode == code && c.Status != ComplaintStatus.Draft, ct);

        if (complaint is null)
            throw new NotFoundException("No complaint was found for that reference code.");

        return new TrackResultDto(
            complaint.ReferenceCode!,
            complaint.Title,
            complaint.Status,
            complaint.SubmittedAt,
            complaint.UpdatedAt,
            complaint.StatusHistory.OrderBy(s => s.ChangedAt).Select(ComplaintMapping.ToDto).ToList());
    }
}

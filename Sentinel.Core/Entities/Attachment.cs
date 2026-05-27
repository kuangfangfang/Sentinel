using Sentinel.Core.Enums;

namespace Sentinel.Core.Entities;

/// <summary>
/// Metadata for an uploaded evidence file. The file itself lives in the file
/// store outside the web root, never in the database (SRS 5.1, 7.3).
/// </summary>
public class Attachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComplaintId { get; set; }
    public Complaint? Complaint { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;
    /// <summary>Non-guessable generated name used on disk (SRS 7.3).</summary>
    public string StoredFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public FileScanStatus ScanStatus { get; set; } = FileScanStatus.Pending;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

namespace Sentinel.Api.Services;

/// <summary>
/// Validates evidence uploads by inspecting the file's content signature (magic
/// bytes), not just its extension (SRS 7.3). Only PDF, JPG, PNG and DOCX pass.
/// </summary>
public static class EvidenceFile
{
    public static bool IsAllowed(Stream stream, string fileName, out string contentType)
    {
        contentType = "application/octet-stream";
        if (!stream.CanRead) return false;

        var startPosition = stream.CanSeek ? stream.Position : 0L;
        Span<byte> header = stackalloc byte[8];
        var read = stream.Read(header);
        if (stream.CanSeek) stream.Position = startPosition;
        if (read < 4) return false;

        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        // PDF — "%PDF"
        if (header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46)
        {
            contentType = "application/pdf";
            return ext == ".pdf";
        }
        // PNG — 89 50 4E 47
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47)
        {
            contentType = "image/png";
            return ext == ".png";
        }
        // JPEG — FF D8 FF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            contentType = "image/jpeg";
            return ext is ".jpg" or ".jpeg";
        }
        // DOCX — ZIP signature "PK\x03\x04"; distinguished from a generic zip by the .docx extension.
        if (header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04 && ext == ".docx")
        {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            return true;
        }

        return false;
    }
}

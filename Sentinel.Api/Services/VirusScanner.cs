using Sentinel.Core.Enums;

namespace Sentinel.Api.Services;

public interface IVirusScanner
{
    Task<FileScanStatus> ScanAsync(Stream content, string fileName, CancellationToken ct = default);
}

/// <summary>
/// Development stub for the virus-scan integration point (SRS 7.3). The hook
/// exists so a real scanner (e.g. ClamAV, an Azure service) can be dropped in
/// without touching the upload flow. In development every file is treated as clean.
/// </summary>
public class StubVirusScanner : IVirusScanner
{
    public Task<FileScanStatus> ScanAsync(Stream content, string fileName, CancellationToken ct = default)
        => Task.FromResult(FileScanStatus.Clean);
}

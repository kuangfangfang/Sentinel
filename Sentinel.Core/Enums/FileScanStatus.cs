namespace Sentinel.Core.Enums;

/// <summary>Virus-scan state of an uploaded evidence file (SRS 7.3).</summary>
public enum FileScanStatus
{
    Pending = 1,
    Clean = 2,
    Infected = 3
}

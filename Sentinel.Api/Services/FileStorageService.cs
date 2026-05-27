namespace Sentinel.Api.Services;

public class FileStorageOptions
{
    public string Root { get; set; } = "App_Data/uploaded-evidence";
    public long MaxFileBytes { get; set; } = 10 * 1024 * 1024; // 10 MB (SRS 7.3)
    public int MaxFilesPerComplaint { get; set; } = 10;
}

public interface IFileStorageService
{
    Task SaveAsync(Stream content, string storedFileName, CancellationToken ct = default);
    Stream OpenRead(string storedFileName);
    void Delete(string storedFileName);
    bool Exists(string storedFileName);
}

/// <summary>
/// Stores evidence files on disk OUTSIDE the web root, under server-generated
/// non-guessable names (SRS 7.3). Only metadata is kept in the database.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;

    public LocalFileStorageService(FileStorageOptions options, IHostEnvironment env)
    {
        _root = Path.IsPathRooted(options.Root)
            ? options.Root
            : Path.Combine(env.ContentRootPath, options.Root);
        Directory.CreateDirectory(_root);
    }

    public async Task SaveAsync(Stream content, string storedFileName, CancellationToken ct = default)
    {
        await using var fs = new FileStream(ResolvePath(storedFileName), FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fs, ct);
    }

    public Stream OpenRead(string storedFileName) =>
        new FileStream(ResolvePath(storedFileName), FileMode.Open, FileAccess.Read, FileShare.Read);

    public void Delete(string storedFileName)
    {
        var path = ResolvePath(storedFileName);
        if (File.Exists(path)) File.Delete(path);
    }

    public bool Exists(string storedFileName) => File.Exists(ResolvePath(storedFileName));

    private string ResolvePath(string storedFileName)
    {
        // storedFileName is a server-generated GUID name; strip any path parts to defeat traversal.
        var safeName = Path.GetFileName(storedFileName);
        return Path.Combine(_root, safeName);
    }
}

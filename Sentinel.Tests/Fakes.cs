using Sentinel.Api.Services;
using Sentinel.Core.Enums;

namespace Sentinel.Tests;

internal sealed class FakeCurrentUser : ICurrentUser
{
    private readonly string[] _roles;
    public FakeCurrentUser(Guid? userId, params string[] roles)
    {
        UserId = userId;
        _roles = roles;
    }

    public Guid? UserId { get; }
    public string? Email => "test@example.com";
    public string? Name => "Test User";
    public bool IsAuthenticated => UserId is not null;
    public bool IsInRole(string role) => _roles.Contains(role);
}

internal sealed class FakeFileStorage : IFileStorageService
{
    private readonly Dictionary<string, byte[]> _store = new();

    public Task SaveAsync(Stream content, string storedFileName, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        content.CopyTo(ms);
        _store[storedFileName] = ms.ToArray();
        return Task.CompletedTask;
    }

    public Stream OpenRead(string storedFileName) => new MemoryStream(_store[storedFileName]);
    public void Delete(string storedFileName) => _store.Remove(storedFileName);
    public bool Exists(string storedFileName) => _store.ContainsKey(storedFileName);
}

internal sealed class FakeVirusScanner : IVirusScanner
{
    public Task<FileScanStatus> ScanAsync(Stream content, string fileName, CancellationToken ct = default)
        => Task.FromResult(FileScanStatus.Clean);
}

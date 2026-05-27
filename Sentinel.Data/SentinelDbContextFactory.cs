using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Sentinel.Data;

/// <summary>
/// Design-time factory so `dotnet ef migrations add` / `database update` can build
/// the context without running the API. Uses SQLite (the local development provider).
/// </summary>
public class SentinelDbContextFactory : IDesignTimeDbContextFactory<SentinelDbContext>
{
    public SentinelDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<SentinelDbContext>()
            .UseSqlite("Data Source=sentinel.db")
            .Options;
        return new SentinelDbContext(options);
    }
}

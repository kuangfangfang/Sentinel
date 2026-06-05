using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Sentinel.Tests;

public class CorsConfigurationTests
{
    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("http://localhost:5174")]
    [InlineData("http://localhost:5175")]
    [InlineData("http://127.0.0.1:5173")]
    [InlineData("http://127.0.0.1:5174")]
    [InlineData("http://127.0.0.1:5175")]
    public void Local_development_vite_origins_are_allowed(string origin)
    {
        var appSettingsPath = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "Sentinel.Api",
            "appsettings.json"));

        using var document = JsonDocument.Parse(File.ReadAllText(appSettingsPath));
        var allowedOrigins = document.RootElement
            .GetProperty("Cors")
            .GetProperty("AllowedOrigins")
            .EnumerateArray()
            .Select(element => element.GetString())
            .ToArray();

        allowedOrigins.Should().Contain(origin);
    }
}

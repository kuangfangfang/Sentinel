using System.Security.Cryptography;
using System.Text;

namespace Sentinel.Core.Services;

public interface IReferenceCodeGenerator
{
    /// <summary>Produces a candidate reference code. Callers must check it is unique and retry on collision.</summary>
    string Generate(DateTime utcNow);
}

/// <summary>
/// Generates codes like SEN-2026-7F3K9Q. The random component is drawn from a
/// cryptographic RNG so codes are unique, human-readable and not sequentially
/// guessable (SRS 13.3, FR-22).
/// </summary>
public class ReferenceCodeGenerator : IReferenceCodeGenerator
{
    // Crockford-style base32: digits + letters, excluding I, L, O, U to avoid misreading.
    private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    private const int RandomLength = 6;

    public string Generate(DateTime utcNow)
    {
        var sb = new StringBuilder(RandomLength);
        Span<byte> bytes = stackalloc byte[RandomLength];
        RandomNumberGenerator.Fill(bytes);
        for (var i = 0; i < RandomLength; i++)
            sb.Append(Alphabet[bytes[i] % Alphabet.Length]);
        return $"SEN-{utcNow.Year}-{sb}";
    }
}

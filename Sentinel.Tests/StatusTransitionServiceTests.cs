using FluentAssertions;
using Sentinel.Core.Enums;
using Sentinel.Core.Services;
using Xunit;

namespace Sentinel.Tests;

public class StatusTransitionServiceTests
{
    private readonly StatusTransitionService _service = new();

    [Theory]
    [InlineData(ComplaintStatus.Draft, ComplaintStatus.Submitted)]
    [InlineData(ComplaintStatus.Draft, ComplaintStatus.Withdrawn)]
    [InlineData(ComplaintStatus.Submitted, ComplaintStatus.UnderReview)]
    [InlineData(ComplaintStatus.Submitted, ComplaintStatus.Withdrawn)]
    [InlineData(ComplaintStatus.UnderReview, ComplaintStatus.MoreInfoNeeded)]
    [InlineData(ComplaintStatus.MoreInfoNeeded, ComplaintStatus.UnderReview)]
    [InlineData(ComplaintStatus.UnderReview, ComplaintStatus.Resolved)]
    [InlineData(ComplaintStatus.Resolved, ComplaintStatus.Closed)]
    [InlineData(ComplaintStatus.UnderReview, ComplaintStatus.Withdrawn)]
    public void Valid_transitions_are_allowed(ComplaintStatus from, ComplaintStatus to)
    {
        _service.IsValid(from, to).Should().BeTrue();
        _service.Invoking(s => s.EnsureValid(from, to)).Should().NotThrow();
    }

    [Theory]
    [InlineData(ComplaintStatus.Draft, ComplaintStatus.Resolved)]
    [InlineData(ComplaintStatus.Submitted, ComplaintStatus.Closed)]
    [InlineData(ComplaintStatus.Closed, ComplaintStatus.UnderReview)]
    [InlineData(ComplaintStatus.Withdrawn, ComplaintStatus.Submitted)]
    [InlineData(ComplaintStatus.Resolved, ComplaintStatus.Draft)]
    [InlineData(ComplaintStatus.MoreInfoNeeded, ComplaintStatus.Resolved)]
    public void Invalid_transitions_are_rejected(ComplaintStatus from, ComplaintStatus to)
    {
        _service.IsValid(from, to).Should().BeFalse();
        _service.Invoking(s => s.EnsureValid(from, to))
            .Should().Throw<InvalidStatusTransitionException>();
    }

    [Fact]
    public void AllowedNext_returns_the_documented_options()
    {
        _service.AllowedNext(ComplaintStatus.UnderReview)
            .Should().BeEquivalentTo(new[]
            {
                ComplaintStatus.MoreInfoNeeded,
                ComplaintStatus.Resolved,
                ComplaintStatus.Withdrawn,
            });

        _service.AllowedNext(ComplaintStatus.Closed).Should().BeEmpty();
    }
}

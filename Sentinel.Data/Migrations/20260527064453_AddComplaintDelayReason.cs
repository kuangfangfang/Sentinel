using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddComplaintDelayReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DelayReason",
                table: "Complaints",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DelayReason",
                table: "Complaints");
        }
    }
}

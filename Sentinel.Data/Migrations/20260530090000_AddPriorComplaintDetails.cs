using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(SentinelDbContext))]
    [Migration("20260530090000_AddPriorComplaintDetails")]
    public partial class AddPriorComplaintDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PriorComplaintAgency",
                table: "Complaints",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PriorComplaintDate",
                table: "Complaints",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PriorComplaintFinalisedDate",
                table: "Complaints",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PriorComplaintMade",
                table: "Complaints",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriorComplaintOutcome",
                table: "Complaints",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriorComplaintStatus",
                table: "Complaints",
                type: "TEXT",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriorComplaintAgency",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "PriorComplaintDate",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "PriorComplaintFinalisedDate",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "PriorComplaintMade",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "PriorComplaintOutcome",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "PriorComplaintStatus",
                table: "Complaints");
        }
    }
}

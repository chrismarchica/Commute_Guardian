package com.commute.mbta.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/** Data transfer object for leave-now advice and journey planning. */
@Schema(description = "Leave-now advice with departure windows and risk assessment")
public record LeaveNowAdviceDto(
    @Schema(description = "Origin stop identifier", example = "place-pktrm") String fromStopId,
    @Schema(description = "Destination stop identifier", example = "place-harsq") String toStopId,
    @Schema(description = "Route identifier (if specified)", example = "Red") String routeId,
    @Schema(description = "Timestamp of advice generation", example = "2024-01-15T14:30:00Z")
        Instant timestamp,
    @Schema(description = "Top 3 departure recommendations") List<DepartureWindow> departureWindows,
    @Schema(description = "Overall journey risk assessment") RiskAssessment riskAssessment) {

  @Schema(description = "Recommended departure window")
  public record DepartureWindow(
      @Schema(description = "Recommended departure time", example = "2024-01-15T14:35:00Z")
          Instant departureTime,
      @Schema(description = "Expected arrival time", example = "2024-01-15T14:55:00Z")
          Instant expectedArrival,
      @Schema(description = "Journey duration in minutes", example = "20") int durationMinutes,
      @Schema(description = "Risk level for this window", example = "LOW") RiskLevel riskLevel,
      @Schema(description = "Confidence in timing", example = "0.85") double confidence,
      @Schema(description = "Human-readable advice", example = "Leave now for best reliability")
          String advice) {}

  @Schema(description = "Overall risk assessment for the journey")
  public record RiskAssessment(
      @Schema(description = "Overall risk level", example = "MEDIUM") RiskLevel overallRisk,
      @Schema(description = "Historical on-time percentage", example = "0.78")
          double historicalOnTime,
      @Schema(description = "Current service alerts affecting route") List<String> serviceAlerts,
      @Schema(description = "Factors contributing to risk") List<String> riskFactors) {}

  @Schema(description = "Risk level classification")
  public enum RiskLevel {
    @Schema(description = "Low risk - high reliability expected")
    LOW,
    @Schema(description = "Medium risk - some delays possible")
    MEDIUM,
    @Schema(description = "High risk - significant delays likely")
    HIGH
  }
}

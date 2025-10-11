package com.commute.mbta.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/** Data transfer object for ETA predictions. */
@Schema(description = "ETA predictions for a stop and route")
public record EtaResponseDto(
    @Schema(description = "Stop identifier", example = "place-pktrm") String stopId,
    @Schema(description = "Stop name", example = "Park Street") String stopName,
    @Schema(description = "Route identifier (if filtered)", example = "Red") String routeId,
    @Schema(description = "Timestamp of prediction", example = "2024-01-15T14:30:00Z")
        Instant timestamp,
    @Schema(description = "List of upcoming arrivals") List<Prediction> predictions) {

  @Schema(description = "Individual arrival prediction")
  public record Prediction(
      @Schema(description = "Route identifier", example = "Red") String routeId,
      @Schema(description = "Route name", example = "Red Line") String routeName,
      @Schema(description = "Trip headsign", example = "Alewife") String headsign,
      @Schema(description = "Predicted arrival time", example = "2024-01-15T14:35:00Z")
          Instant arrivalTime,
      @Schema(description = "Minutes until arrival", example = "5") int minutesAway,
      @Schema(description = "Delay in seconds (positive = late)", example = "30")
          Integer delaySeconds,
      @Schema(description = "Confidence level of prediction", example = "HIGH")
          ConfidenceLevel confidence) {}

  @Schema(description = "Confidence level of ETA prediction")
  public enum ConfidenceLevel {
    HIGH,
    MEDIUM,
    LOW
  }
}

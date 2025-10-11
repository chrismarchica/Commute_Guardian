package com.commute.mbta.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/** Data transfer object for route reliability metrics. */
@Schema(description = "Route reliability metrics and statistics")
public record ReliabilityMetricsDto(
    @Schema(description = "Route identifier", example = "Red") String routeId,
    @Schema(description = "Day of week filter applied", example = "MON") String dayOfWeek,
    @Schema(description = "Hour filter applied", example = "7") Integer hour,
    @Schema(description = "Overall reliability statistics") OverallMetrics overall,
    @Schema(description = "Per-stop reliability breakdown") List<StopMetrics> stops) {

  @Schema(description = "Overall route reliability metrics")
  public record OverallMetrics(
      @Schema(description = "Number of data samples", example = "1250") int samples,
      @Schema(description = "Median delay in seconds", example = "45") int medianDelaySeconds,
      @Schema(description = "90th percentile delay in seconds", example = "180") int p90DelaySeconds,
      @Schema(description = "On-time performance percentage", example = "0.78") double onTimePercentage,
      @Schema(description = "Headway standard deviation in seconds", example = "120.5")
          double headwayStdSeconds) {}

  @Schema(description = "Per-stop reliability metrics")
  public record StopMetrics(
      @Schema(description = "Stop identifier", example = "place-pktrm") String stopId,
      @Schema(description = "Stop name", example = "Park Street") String stopName,
      @Schema(description = "Number of data samples", example = "125") int samples,
      @Schema(description = "Median delay in seconds", example = "30") int medianDelaySeconds,
      @Schema(description = "90th percentile delay in seconds", example = "150") int p90DelaySeconds,
      @Schema(description = "On-time performance percentage", example = "0.82") double onTimePercentage) {}
}

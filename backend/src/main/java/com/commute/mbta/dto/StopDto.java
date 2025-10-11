package com.commute.mbta.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/** Data transfer object for MBTA stop information. */
@Schema(description = "MBTA stop information")
public record StopDto(
    @Schema(description = "Unique stop identifier", example = "place-pktrm") String id,
    @Schema(description = "Stop name", example = "Park Street") String name,
    @Schema(description = "Latitude in decimal degrees", example = "42.3561") double latitude,
    @Schema(description = "Longitude in decimal degrees", example = "-71.0624") double longitude,
    @Schema(description = "Distance from query point in meters", example = "150.5")
        Double distanceMeters,
    @Schema(description = "Routes serving this stop") List<String> routes) {

  /** Create a StopDto without distance information. */
  public static StopDto of(String id, String name, double latitude, double longitude, List<String> routes) {
    return new StopDto(id, name, latitude, longitude, null, routes);
  }

  /** Create a StopDto with distance information. */
  public static StopDto withDistance(
      String id, String name, double latitude, double longitude, double distanceMeters, List<String> routes) {
    return new StopDto(id, name, latitude, longitude, distanceMeters, routes);
  }
}

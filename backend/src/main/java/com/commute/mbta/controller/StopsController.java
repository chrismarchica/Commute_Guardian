package com.commute.mbta.controller;

import com.commute.mbta.dto.StopDto;
import com.commute.mbta.service.StopsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Controller for MBTA stops and location-based queries. */
@RestController
@RequestMapping("/api/stops")
@Tag(name = "Stops", description = "MBTA stops and location services")
@Validated
public class StopsController {

  private final StopsService stopsService;

  @Autowired
  public StopsController(StopsService stopsService) {
    this.stopsService = stopsService;
  }

  @GetMapping("/near")
  @Operation(
      summary = "Find nearby stops",
      description = "Get MBTA stops within specified radius of coordinates")
  public ResponseEntity<List<StopDto>> getNearbyStops(
      @Parameter(description = "Latitude in decimal degrees", example = "42.3601")
          @RequestParam
          @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
          @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
          double lat,
      @Parameter(description = "Longitude in decimal degrees", example = "-71.0589")
          @RequestParam
          @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
          @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
          double lon,
      @Parameter(description = "Search radius in meters", example = "500")
          @RequestParam(defaultValue = "500")
          @Min(value = 1, message = "Radius must be at least 1 meter")
          @Max(value = 5000, message = "Radius cannot exceed 5000 meters")
          int radius) {

    List<StopDto> nearbyStops = stopsService.findNearbyStops(lat, lon, radius);
    return ResponseEntity.ok(nearbyStops);
  }
}

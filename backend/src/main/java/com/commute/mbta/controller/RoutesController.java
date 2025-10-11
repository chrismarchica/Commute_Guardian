package com.commute.mbta.controller;

import com.commute.mbta.dto.ReliabilityMetricsDto;
import com.commute.mbta.service.ReliabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Controller for route reliability metrics and analysis. */
@RestController
@RequestMapping("/api/routes")
@Tag(name = "Routes", description = "Route reliability and performance metrics")
@Validated
public class RoutesController {

  private final ReliabilityService reliabilityService;

  @Autowired
  public RoutesController(ReliabilityService reliabilityService) {
    this.reliabilityService = reliabilityService;
  }

  @GetMapping("/{routeId}/reliability")
  @Operation(
      summary = "Get route reliability metrics",
      description = "Returns reliability statistics for a route by day of week and hour")
  public ResponseEntity<ReliabilityMetricsDto> getRouteReliability(
      @Parameter(description = "MBTA Route ID", example = "Red")
          @PathVariable
          String routeId,
      @Parameter(description = "Day of week", example = "MON")
          @RequestParam(required = false)
          String dow,
      @Parameter(description = "Hour of day (0-23)", example = "7")
          @RequestParam(required = false)
          @Min(value = 0, message = "Hour must be >= 0")
          @Max(value = 23, message = "Hour must be <= 23")
          Integer hour) {

    ReliabilityMetricsDto metrics = reliabilityService.getRouteReliability(routeId, dow, hour);
    return ResponseEntity.ok(metrics);
  }
}

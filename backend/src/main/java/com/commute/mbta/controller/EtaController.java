package com.commute.mbta.controller;

import com.commute.mbta.dto.EtaResponseDto;
import com.commute.mbta.dto.LeaveNowAdviceDto;
import com.commute.mbta.service.EtaService;
import com.commute.mbta.service.LeaveNowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Controller for ETA predictions and leave-now advice. */
@RestController
@RequestMapping("/api")
@Tag(name = "Predictions", description = "ETA predictions and departure advice")
public class EtaController {

  private final EtaService etaService;
  private final LeaveNowService leaveNowService;

  @Autowired
  public EtaController(EtaService etaService, LeaveNowService leaveNowService) {
    this.etaService = etaService;
    this.leaveNowService = leaveNowService;
  }

  @GetMapping("/eta")
  @Operation(
      summary = "Get ETA predictions",
      description = "Returns estimated arrival times for a specific stop and route")
  public ResponseEntity<EtaResponseDto> getEta(
      @Parameter(description = "MBTA Stop ID", example = "place-pktrm")
          @RequestParam
          String stopId,
      @Parameter(description = "MBTA Route ID (optional)", example = "Red")
          @RequestParam(required = false)
          String routeId) {

    EtaResponseDto eta = etaService.getEta(stopId, routeId);
    return ResponseEntity.ok(eta);
  }

  @GetMapping("/leave-now")
  @Operation(
      summary = "Get leave-now advice",
      description = "Returns optimal departure windows and risk assessment for a journey")
  public ResponseEntity<LeaveNowAdviceDto> getLeaveNowAdvice(
      @Parameter(description = "Origin stop ID", example = "place-pktrm")
          @RequestParam
          String fromStop,
      @Parameter(description = "Destination stop ID", example = "place-harsq")
          @RequestParam
          String toStop,
      @Parameter(description = "Route ID (optional)", example = "Red")
          @RequestParam(required = false)
          String routeId) {

    LeaveNowAdviceDto advice = leaveNowService.getLeaveNowAdvice(fromStop, toStop, routeId);
    return ResponseEntity.ok(advice);
  }
}

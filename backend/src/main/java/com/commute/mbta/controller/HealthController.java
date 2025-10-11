package com.commute.mbta.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Health check controller for service monitoring. */
@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Service health and status endpoints")
public class HealthController {

  @GetMapping("/health")
  @Operation(summary = "Get service health status", description = "Returns basic health status")
  public ResponseEntity<Map<String, Object>> health() {
    return ResponseEntity.ok(
        Map.of(
            "status", "ok",
            "timestamp", Instant.now().toString(),
            "service", "commute-guardian-backend",
            "version", "1.0.0"));
  }
}

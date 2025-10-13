package com.commute.mbta.controller;

import com.commute.mbta.service.DataIngestionService;
import com.commute.mbta.service.FixtureReplayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Administrative endpoints for data loading and fixture replay. */
@RestController
@RequestMapping("/admin")
@Tag(name = "Admin", description = "Administrative operations for data management")
public class AdminController {

  private final DataIngestionService dataIngestionService;
  private final FixtureReplayService fixtureReplayService;

  @Autowired
  public AdminController(
      DataIngestionService dataIngestionService, FixtureReplayService fixtureReplayService) {
    this.dataIngestionService = dataIngestionService;
    this.fixtureReplayService = fixtureReplayService;
  }

  @PostMapping("/loadStatic")
  @Operation(
      summary = "Load static GTFS data",
      description = "Load GTFS static data from file or URL source")
  public ResponseEntity<Map<String, Object>> loadStaticData(
      @Parameter(description = "Data source: 'file', 'url', or 'api'", example = "api")
          @RequestParam(defaultValue = "api")
          String source) {

    try {
      String result = dataIngestionService.loadStaticData(source);
      return ResponseEntity.ok(
          Map.of(
              "status", "success",
              "message", "Static data loaded successfully",
              "details", result));
    } catch (Exception e) {
      return ResponseEntity.internalServerError()
          .body(
              Map.of(
                  "status", "error",
                  "message", "Failed to load static data",
                  "error", e.getMessage()));
    }
  }

  @PostMapping("/replayFixtures")
  @Operation(
      summary = "Replay GTFS-RT fixtures",
      description = "Start replaying GTFS-RT fixture data at specified speed")
  public ResponseEntity<Map<String, Object>> replayFixtures(
      @Parameter(description = "Replay speed multiplier", example = "10")
          @RequestParam(defaultValue = "10")
          int speed) {

    try {
      String result = fixtureReplayService.startReplay(speed);
      return ResponseEntity.ok(
          Map.of(
              "status", "success",
              "message", "Fixture replay started",
              "details", result,
              "speed", speed + "x"));
    } catch (Exception e) {
      return ResponseEntity.internalServerError()
          .body(
              Map.of(
                  "status", "error",
                  "message", "Failed to start fixture replay",
                  "error", e.getMessage()));
    }
  }

  @PostMapping("/stopReplay")
  @Operation(summary = "Stop fixture replay", description = "Stop the current fixture replay")
  public ResponseEntity<Map<String, Object>> stopReplay() {
    try {
      fixtureReplayService.stopReplay();
      return ResponseEntity.ok(
          Map.of("status", "success", "message", "Fixture replay stopped"));
    } catch (Exception e) {
      return ResponseEntity.internalServerError()
          .body(
              Map.of(
                  "status", "error",
                  "message", "Failed to stop fixture replay",
                  "error", e.getMessage()));
    }
  }
}

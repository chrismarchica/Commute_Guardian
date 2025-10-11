package com.commute.mbta.service;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Service for replaying GTFS-RT fixture data at accelerated speeds. */
@Service
public class FixtureReplayService {

  private static final Logger logger = LoggerFactory.getLogger(FixtureReplayService.class);
  private static final String FIXTURES_RT_PATH = "fixtures/gtfsrt/";

  private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
  private ScheduledFuture<?> replayTask;
  private boolean isReplaying = false;

  /**
   * Start replaying GTFS-RT fixture data at the specified speed.
   * 
   * @param speed Speed multiplier (e.g., 10 = 10x faster than real-time)
   * @return Status message describing the replay start
   */
  public String startReplay(int speed) throws Exception {
    if (isReplaying) {
      throw new IllegalStateException("Replay is already running. Stop current replay first.");
    }

    logger.info("Starting GTFS-RT fixture replay at {}x speed", speed);

    // Check if fixture files exist
    Path fixturesPath = Paths.get(FIXTURES_RT_PATH);
    File fixturesDir = fixturesPath.toFile();

    if (!fixturesDir.exists()) {
      logger.warn("Fixtures directory not found at {}, creating with samples", FIXTURES_RT_PATH);
      createSampleFixtures(fixturesDir);
    }

    // Start the replay task
    long intervalMs = Math.max(1000 / speed, 100); // Minimum 100ms interval
    replayTask = scheduler.scheduleAtFixedRate(
        () -> processNextFixture(),
        0,
        intervalMs,
        TimeUnit.MILLISECONDS);

    isReplaying = true;
    
    String message = String.format("Started fixture replay at %dx speed (interval: %dms)", speed, intervalMs);
    logger.info(message);
    return message;
  }

  /**
   * Stop the current fixture replay.
   */
  public void stopReplay() {
    if (replayTask != null && !replayTask.isCancelled()) {
      replayTask.cancel(false);
      logger.info("Fixture replay stopped");
    }
    isReplaying = false;
  }

  /**
   * Check if replay is currently running.
   */
  public boolean isReplaying() {
    return isReplaying && replayTask != null && !replayTask.isCancelled();
  }

  /**
   * Process the next fixture in the replay sequence.
   * This simulates receiving real-time GTFS-RT data.
   */
  private void processNextFixture() {
    try {
      // TODO: Implement actual fixture processing
      // This would involve:
      // 1. Read next protobuf file from fixtures/gtfsrt/
      // 2. Parse GTFS-RT TripUpdate and VehiclePosition messages
      // 3. Insert data into rt_trip_updates and rt_vehicle_positions tables
      // 4. Update EWMA state for delay predictions
      // 5. Trigger reliability metric recalculation

      simulateRealtimeDataProcessing();
      
    } catch (Exception e) {
      logger.error("Error processing fixture during replay", e);
    }
  }

  /**
   * Simulate real-time data processing for demonstration.
   */
  private void simulateRealtimeDataProcessing() {
    // Generate sample real-time updates
    Instant now = Instant.now();
    
    // Simulate trip updates for various routes
    simulateTripUpdate("Red", "place-pktrm", 30, now); // 30 seconds late
    simulateTripUpdate("Orange", "place-dwnxg", -15, now); // 15 seconds early
    simulateTripUpdate("Blue", "place-state", 60, now); // 1 minute late
    simulateTripUpdate("Green-B", "place-pktrm", 120, now); // 2 minutes late

    // Simulate vehicle positions
    simulateVehiclePosition("Red", "vehicle-R-001", 42.3561, -71.0624, now);
    simulateVehiclePosition("Orange", "vehicle-O-002", 42.3555, -71.0640, now);

    logger.debug("Processed simulated real-time updates at {}", now);
  }

  /**
   * Simulate processing a trip update.
   */
  private void simulateTripUpdate(String routeId, String stopId, int delaySeconds, Instant timestamp) {
    // TODO: Insert into rt_trip_updates table
    // TODO: Update EWMA state
    logger.trace("Trip update: {} at {} delayed by {}s", routeId, stopId, delaySeconds);
  }

  /**
   * Simulate processing a vehicle position.
   */
  private void simulateVehiclePosition(String routeId, String vehicleId, double lat, double lon, Instant timestamp) {
    // TODO: Insert into rt_vehicle_positions table
    logger.trace("Vehicle position: {} at {}, {}", vehicleId, lat, lon);
  }

  /**
   * Create sample fixture files for demonstration.
   */
  private void createSampleFixtures(File fixturesDir) throws Exception {
    logger.info("Creating sample GTFS-RT fixtures at {}", fixturesDir.getAbsolutePath());
    
    // Ensure directory exists
    fixturesDir.mkdirs();
    
    // Create placeholder files
    File tripUpdatesFile = new File(fixturesDir, "trip_updates.pb");
    File vehiclePositionsFile = new File(fixturesDir, "vehicle_positions.pb");
    
    tripUpdatesFile.createNewFile();
    vehiclePositionsFile.createNewFile();
    
    logger.info("Sample fixture files created. In production, these would contain real GTFS-RT protobuf data.");
  }

  /**
   * Cleanup resources when service is destroyed.
   */
  public void destroy() {
    stopReplay();
    scheduler.shutdown();
    try {
      if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
        scheduler.shutdownNow();
      }
    } catch (InterruptedException e) {
      scheduler.shutdownNow();
      Thread.currentThread().interrupt();
    }
  }
}

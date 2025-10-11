package com.commute.mbta.service;

import com.commute.mbta.dto.EtaResponseDto;
import com.commute.mbta.dto.EtaResponseDto.ConfidenceLevel;
import com.commute.mbta.dto.EtaResponseDto.Prediction;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Service for ETA predictions and real-time arrival information. */
@Service
public class EtaService {

  private static final Logger logger = LoggerFactory.getLogger(EtaService.class);

  /**
   * Get ETA predictions for a stop, optionally filtered by route.
   * 
   * <p>This is a placeholder implementation that generates sample predictions.
   * In production, this would:
   * 1. Query real-time data from MBTA v3 API or GTFS-RT
   * 2. Apply EWMA-based delay predictions
   * 3. Combine with schedule data for comprehensive predictions
   */
  public EtaResponseDto getEta(String stopId, String routeId) {
    logger.info("Getting ETA for stop {} (route filter: {})", stopId, routeId);

    // TODO: Replace with actual real-time data queries
    // This would typically involve:
    // 1. Query rt_trip_updates for recent predictions
    // 2. Query stop_times for scheduled arrivals
    // 3. Apply EWMA predictions from ewma_state table
    // 4. Combine and rank predictions by confidence

    String stopName = getStopName(stopId);
    Instant now = Instant.now();
    List<Prediction> predictions = generateSamplePredictions(stopId, routeId, now);

    return new EtaResponseDto(stopId, stopName, routeId, now, predictions);
  }

  /**
   * Generate sample predictions for demonstration.
   * In production, this would query real-time and schedule data.
   */
  private List<Prediction> generateSamplePredictions(String stopId, String routeId, Instant now) {
    List<Prediction> predictions = new ArrayList<>();

    // Generate predictions based on stop and route
    if (routeId == null || "Red".equals(routeId)) {
      if (isRedLineStop(stopId)) {
        predictions.add(new Prediction(
            "Red",
            "Red Line",
            "Alewife",
            now.plus(3, ChronoUnit.MINUTES),
            3,
            30,
            ConfidenceLevel.HIGH));
        predictions.add(new Prediction(
            "Red",
            "Red Line",
            "Braintree",
            now.plus(7, ChronoUnit.MINUTES),
            7,
            -15,
            ConfidenceLevel.HIGH));
        predictions.add(new Prediction(
            "Red",
            "Red Line",
            "Alewife",
            now.plus(12, ChronoUnit.MINUTES),
            12,
            60,
            ConfidenceLevel.MEDIUM));
      }
    }

    if (routeId == null || "Orange".equals(routeId)) {
      if (isOrangeLineStop(stopId)) {
        predictions.add(new Prediction(
            "Orange",
            "Orange Line",
            "Oak Grove",
            now.plus(5, ChronoUnit.MINUTES),
            5,
            45,
            ConfidenceLevel.HIGH));
        predictions.add(new Prediction(
            "Orange",
            "Orange Line",
            "Forest Hills",
            now.plus(9, ChronoUnit.MINUTES),
            9,
            0,
            ConfidenceLevel.HIGH));
      }
    }

    if (routeId == null || "Blue".equals(routeId)) {
      if (isBlueLineStop(stopId)) {
        predictions.add(new Prediction(
            "Blue",
            "Blue Line",
            "Wonderland",
            now.plus(4, ChronoUnit.MINUTES),
            4,
            15,
            ConfidenceLevel.HIGH));
        predictions.add(new Prediction(
            "Blue",
            "Blue Line",
            "Bowdoin",
            now.plus(8, ChronoUnit.MINUTES),
            8,
            -30,
            ConfidenceLevel.MEDIUM));
      }
    }

    // Add Green Line predictions for multi-line stops
    if ((routeId == null || routeId.startsWith("Green")) && isGreenLineStop(stopId)) {
      predictions.add(new Prediction(
          "Green-B",
          "Green Line B",
          "Boston College",
          now.plus(6, ChronoUnit.MINUTES),
          6,
          90,
          ConfidenceLevel.MEDIUM));
      predictions.add(new Prediction(
          "Green-C",
          "Green Line C",
          "Cleveland Circle",
          now.plus(11, ChronoUnit.MINUTES),
          11,
          120,
          ConfidenceLevel.LOW));
    }

    // Sort by arrival time
    predictions.sort((a, b) -> a.arrivalTime().compareTo(b.arrivalTime()));

    // Limit to next 10 predictions
    return predictions.stream().limit(10).toList();
  }

  /**
   * Get human-readable stop name.
   * In production, this would query the stops table.
   */
  private String getStopName(String stopId) {
    return switch (stopId) {
      case "place-pktrm" -> "Park Street";
      case "place-dwnxg" -> "Downtown Crossing";
      case "place-harsq" -> "Harvard";
      case "place-sstat" -> "South Station";
      case "place-north" -> "North Station";
      case "place-state" -> "State";
      case "place-gover" -> "Government Center";
      default -> "Unknown Stop";
    };
  }

  /**
   * Check if stop is served by Red Line.
   */
  private boolean isRedLineStop(String stopId) {
    return List.of("place-pktrm", "place-dwnxg", "place-harsq", "place-sstat", 
                   "place-cntsq", "place-knncl", "place-chmnl").contains(stopId);
  }

  /**
   * Check if stop is served by Orange Line.
   */
  private boolean isOrangeLineStop(String stopId) {
    return List.of("place-dwnxg", "place-state", "place-haecl", "place-north",
                   "place-ccmnl", "place-sull").contains(stopId);
  }

  /**
   * Check if stop is served by Blue Line.
   */
  private boolean isBlueLineStop(String stopId) {
    return List.of("place-state", "place-gover", "place-bomnl", "place-aqucl").contains(stopId);
  }

  /**
   * Check if stop is served by Green Line.
   */
  private boolean isGreenLineStop(String stopId) {
    return List.of("place-pktrm", "place-gover", "place-boylston", "place-armnl",
                   "place-coecl", "place-hymnl").contains(stopId);
  }
}

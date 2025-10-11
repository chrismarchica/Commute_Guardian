package com.commute.mbta.service;

import com.commute.mbta.dto.ReliabilityMetricsDto;
import com.commute.mbta.dto.ReliabilityMetricsDto.OverallMetrics;
import com.commute.mbta.dto.ReliabilityMetricsDto.StopMetrics;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Service for computing and retrieving route reliability metrics. */
@Service
public class ReliabilityService {

  private static final Logger logger = LoggerFactory.getLogger(ReliabilityService.class);

  /**
   * Get reliability metrics for a route, optionally filtered by day of week and hour.
   * 
   * <p>This is a placeholder implementation that returns sample data.
   * In production, this would query the metrics_route_stop_hour table.
   */
  public ReliabilityMetricsDto getRouteReliability(String routeId, String dow, Integer hour) {
    logger.info("Getting reliability metrics for route {} (dow: {}, hour: {})", routeId, dow, hour);

    // TODO: Replace with actual database queries
    // This would typically involve:
    // 1. Query metrics_route_stop_hour table with filters
    // 2. Aggregate data across stops for overall metrics
    // 3. Return per-stop breakdown

    // Sample data for demonstration
    OverallMetrics overall = generateSampleOverallMetrics(routeId);
    List<StopMetrics> stops = generateSampleStopMetrics(routeId);

    return new ReliabilityMetricsDto(routeId, dow, hour, overall, stops);
  }

  /**
   * Generate sample overall metrics for demonstration.
   * In production, this would aggregate from the database.
   */
  private OverallMetrics generateSampleOverallMetrics(String routeId) {
    // Simulate different reliability patterns by route
    return switch (routeId.toLowerCase()) {
      case "red" -> new OverallMetrics(2450, 45, 180, 0.78, 120.5);
      case "orange" -> new OverallMetrics(1890, 60, 210, 0.72, 145.2);
      case "blue" -> new OverallMetrics(1650, 30, 150, 0.85, 95.8);
      case "green-b", "green-c", "green-d", "green-e" -> 
          new OverallMetrics(980, 75, 240, 0.65, 180.3);
      default -> new OverallMetrics(1200, 50, 190, 0.75, 130.0);
    };
  }

  /**
   * Generate sample per-stop metrics for demonstration.
   * In production, this would query the database for actual stop data.
   */
  private List<StopMetrics> generateSampleStopMetrics(String routeId) {
    // Sample stops for different routes
    return switch (routeId.toLowerCase()) {
      case "red" -> List.of(
          new StopMetrics("place-alfcl", "Alewife", 245, 30, 150, 0.82),
          new StopMetrics("place-davis", "Davis", 240, 35, 160, 0.80),
          new StopMetrics("place-portr", "Porter", 235, 40, 170, 0.78),
          new StopMetrics("place-harsq", "Harvard", 250, 45, 180, 0.76),
          new StopMetrics("place-cntsq", "Central", 245, 50, 190, 0.74),
          new StopMetrics("place-knncl", "Kendall/MIT", 240, 45, 185, 0.76),
          new StopMetrics("place-chmnl", "Charles/MGH", 235, 40, 175, 0.78),
          new StopMetrics("place-pktrm", "Park Street", 260, 55, 200, 0.72),
          new StopMetrics("place-dwnxg", "Downtown Crossing", 255, 50, 195, 0.74),
          new StopMetrics("place-sstat", "South Station", 250, 45, 180, 0.76)
      );
      case "orange" -> List.of(
          new StopMetrics("place-ogmnl", "Oak Grove", 189, 45, 190, 0.75),
          new StopMetrics("place-mlmnl", "Malden Center", 185, 50, 200, 0.73),
          new StopMetrics("place-welln", "Wellington", 180, 55, 210, 0.71),
          new StopMetrics("place-astao", "Assembly", 175, 60, 220, 0.69),
          new StopMetrics("place-sull", "Sullivan Square", 170, 65, 230, 0.67),
          new StopMetrics("place-ccmnl", "Community College", 165, 60, 225, 0.69),
          new StopMetrics("place-north", "North Station", 180, 55, 210, 0.71),
          new StopMetrics("place-haecl", "Haymarket", 185, 50, 200, 0.73),
          new StopMetrics("place-state", "State", 190, 45, 190, 0.75),
          new StopMetrics("place-dwnxg", "Downtown Crossing", 195, 40, 180, 0.77)
      );
      default -> List.of(
          new StopMetrics("sample-stop-1", "Sample Stop 1", 120, 50, 190, 0.75),
          new StopMetrics("sample-stop-2", "Sample Stop 2", 115, 55, 200, 0.73),
          new StopMetrics("sample-stop-3", "Sample Stop 3", 110, 60, 210, 0.71)
      );
    };
  }

  /**
   * Convert day of week string to integer (1=Monday, 7=Sunday).
   */
  private Integer parseDayOfWeek(String dow) {
    if (dow == null || dow.isEmpty()) {
      return null;
    }

    try {
      DayOfWeek dayOfWeek = DayOfWeek.valueOf(dow.toUpperCase().substring(0, 3));
      return dayOfWeek.getValue();
    } catch (Exception e) {
      logger.warn("Invalid day of week: {}", dow);
      return null;
    }
  }

  /**
   * Validate hour parameter.
   */
  private boolean isValidHour(Integer hour) {
    return hour != null && hour >= 0 && hour <= 23;
  }
}

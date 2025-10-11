package com.commute.mbta.service;

import com.commute.mbta.dto.LeaveNowAdviceDto;
import com.commute.mbta.dto.LeaveNowAdviceDto.DepartureWindow;
import com.commute.mbta.dto.LeaveNowAdviceDto.RiskAssessment;
import com.commute.mbta.dto.LeaveNowAdviceDto.RiskLevel;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Service for leave-now advice and journey planning with risk assessment. */
@Service
public class LeaveNowService {

  private static final Logger logger = LoggerFactory.getLogger(LeaveNowService.class);

  /**
   * Get leave-now advice for a journey between two stops.
   * 
   * <p>This implementation uses a simplified EWMA-based heuristic with sample data.
   * In production, this would:
   * 1. Query ewma_state table for current delay predictions
   * 2. Analyze historical reliability from metrics_route_stop_hour
   * 3. Consider current service alerts
   * 4. Apply machine learning models for risk assessment
   */
  public LeaveNowAdviceDto getLeaveNowAdvice(String fromStop, String toStop, String routeId) {
    logger.info("Generating leave-now advice from {} to {} (route: {})", fromStop, toStop, routeId);

    // TODO: Replace with actual algorithm implementation
    // This would typically involve:
    // 1. Route planning between stops
    // 2. EWMA delay prediction for departure times
    // 3. Historical reliability analysis
    // 4. Risk band classification
    // 5. Service alert integration

    Instant now = Instant.now();
    List<DepartureWindow> windows = generateDepartureWindows(fromStop, toStop, routeId, now);
    RiskAssessment riskAssessment = assessJourneyRisk(fromStop, toStop, routeId);

    return new LeaveNowAdviceDto(fromStop, toStop, routeId, now, windows, riskAssessment);
  }

  /**
   * Generate recommended departure windows using EWMA-based predictions.
   */
  private List<DepartureWindow> generateDepartureWindows(
      String fromStop, String toStop, String routeId, Instant now) {
    
    List<DepartureWindow> windows = new ArrayList<>();

    // Base journey time estimation (would be calculated from stop_times in production)
    int baseJourneyMinutes = estimateJourneyTime(fromStop, toStop, routeId);
    
    // Generate 3 departure windows with different risk profiles
    
    // Window 1: Leave now (highest urgency, medium risk)
    windows.add(new DepartureWindow(
        now,
        now.plus(baseJourneyMinutes + 2, ChronoUnit.MINUTES), // Add expected delay
        baseJourneyMinutes + 2,
        RiskLevel.MEDIUM,
        0.75,
        "Leave now for reasonable reliability with some delay risk"));

    // Window 2: Leave in 5 minutes (balanced option)
    windows.add(new DepartureWindow(
        now.plus(5, ChronoUnit.MINUTES),
        now.plus(5 + baseJourneyMinutes, ChronoUnit.MINUTES),
        baseJourneyMinutes,
        RiskLevel.LOW,
        0.85,
        "Wait 5 minutes for better reliability and on-time arrival"));

    // Window 3: Leave in 12 minutes (next service cycle, lowest risk)
    windows.add(new DepartureWindow(
        now.plus(12, ChronoUnit.MINUTES),
        now.plus(12 + baseJourneyMinutes - 1, ChronoUnit.MINUTES), // Slightly faster due to less crowding
        baseJourneyMinutes - 1,
        RiskLevel.LOW,
        0.90,
        "Wait for next train - highest reliability and fastest journey"));

    return windows;
  }

  /**
   * Assess overall journey risk based on historical data and current conditions.
   */
  private RiskAssessment assessJourneyRisk(String fromStop, String toStop, String routeId) {
    // Simulate risk assessment based on route characteristics
    RiskLevel overallRisk = calculateOverallRisk(routeId);
    double historicalOnTime = getHistoricalOnTimePerformance(routeId);
    List<String> serviceAlerts = getCurrentServiceAlerts(routeId);
    List<String> riskFactors = identifyRiskFactors(fromStop, toStop, routeId);

    return new RiskAssessment(overallRisk, historicalOnTime, serviceAlerts, riskFactors);
  }

  /**
   * Estimate journey time between stops.
   * In production, this would query stop_times and calculate actual travel time.
   */
  private int estimateJourneyTime(String fromStop, String toStop, String routeId) {
    // Simplified estimation based on route type and common journeys
    if (routeId != null && routeId.startsWith("Green")) {
      return 15; // Green Line tends to be slower
    }
    
    // Sample journey times for common routes
    return switch (fromStop + "->" + toStop) {
      case "place-pktrm->place-harsq" -> 12; // Park St to Harvard
      case "place-harsq->place-pktrm" -> 12; // Harvard to Park St
      case "place-pktrm->place-sstat" -> 8;  // Park St to South Station
      case "place-sstat->place-pktrm" -> 8;  // South Station to Park St
      case "place-dwnxg->place-north" -> 10; // Downtown Crossing to North Station
      default -> 18; // Default estimate
    };
  }

  /**
   * Calculate overall risk level based on route reliability.
   */
  private RiskLevel calculateOverallRisk(String routeId) {
    // Simulate risk calculation based on route characteristics
    return switch (routeId != null ? routeId.toLowerCase() : "unknown") {
      case "blue" -> RiskLevel.LOW;    // Blue Line is typically most reliable
      case "red" -> RiskLevel.MEDIUM;  // Red Line has moderate reliability
      case "orange" -> RiskLevel.MEDIUM; // Orange Line moderate reliability
      case "green-b", "green-c", "green-d", "green-e" -> RiskLevel.HIGH; // Green Line more variable
      default -> RiskLevel.MEDIUM;
    };
  }

  /**
   * Get historical on-time performance for the route.
   */
  private double getHistoricalOnTimePerformance(String routeId) {
    // Simulate historical performance data
    return switch (routeId != null ? routeId.toLowerCase() : "unknown") {
      case "blue" -> 0.85;
      case "red" -> 0.78;
      case "orange" -> 0.72;
      case "green-b", "green-c", "green-d", "green-e" -> 0.65;
      default -> 0.75;
    };
  }

  /**
   * Get current service alerts affecting the route.
   * In production, this would query the service_alerts table.
   */
  private List<String> getCurrentServiceAlerts(String routeId) {
    // Simulate current alerts (in production, query service_alerts table)
    List<String> alerts = new ArrayList<>();
    
    // Add sample alerts based on time of day or route
    if (routeId != null && routeId.toLowerCase().contains("green")) {
      alerts.add("Minor delays due to traffic signal priority");
    }
    
    return alerts;
  }

  /**
   * Identify risk factors for the specific journey.
   */
  private List<String> identifyRiskFactors(String fromStop, String toStop, String routeId) {
    List<String> factors = new ArrayList<>();
    
    // Add factors based on route and stops
    if (routeId != null && routeId.toLowerCase().contains("green")) {
      factors.add("Surface running with traffic signals");
      factors.add("Higher variability in travel times");
    }
    
    if ("place-pktrm".equals(fromStop) || "place-pktrm".equals(toStop)) {
      factors.add("Major transfer station - potential crowding");
    }
    
    if ("place-dwnxg".equals(fromStop) || "place-dwnxg".equals(toStop)) {
      factors.add("Downtown location - peak hour congestion");
    }
    
    // Add time-based factors
    Instant now = Instant.now();
    int hour = now.atZone(java.time.ZoneId.systemDefault()).getHour();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      factors.add("Peak commuting hours - increased delays possible");
    }
    
    return factors;
  }
}

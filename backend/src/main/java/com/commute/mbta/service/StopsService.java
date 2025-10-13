package com.commute.mbta.service;

import com.commute.mbta.dto.StopDto;
import com.commute.mbta.entity.Stop;
import com.commute.mbta.repository.StopRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/** Service for stop-related operations and location queries. */
@Service
public class StopsService {

  private static final Logger logger = LoggerFactory.getLogger(StopsService.class);

  private final StopRepository stopRepository;

  @Autowired
  public StopsService(StopRepository stopRepository) {
    this.stopRepository = stopRepository;
  }

  /**
   * Find nearby stops within the specified radius.
   * Results are cached for performance.
   */
  @Cacheable(value = "stops", key = "#lat + '_' + #lon + '_' + #radiusMeters")
  public List<StopDto> findNearbyStops(double lat, double lon, int radiusMeters) {
    logger.info("Finding stops near {}, {} within {} meters", lat, lon, radiusMeters);

    List<Object[]> results = stopRepository.findNearbyStopsWithDistance(lat, lon, radiusMeters);
    List<StopDto> stops = new ArrayList<>();

    for (Object[] row : results) {
      // Extract data from native query result
      String id = (String) row[0];
      String name = (String) row[1];
      
      // Handle both BigDecimal and Double types from PostgreSQL
      double latitude = convertToDouble(row[2]);
      double longitude = convertToDouble(row[3]);
      double distance = convertToDouble(row[row.length - 1]); // Distance is last column

      // For now, return empty routes list - this would be populated from route_stops table
      List<String> routes = getRoutesForStop(id);

      StopDto stopDto =
          StopDto.withDistance(
              id,
              name,
              latitude,
              longitude,
              distance,
              routes);

      stops.add(stopDto);
    }

    logger.info("Found {} stops near {}, {}", stops.size(), lat, lon);
    return stops;
  }

  /**
   * Convert a numeric value from PostgreSQL to double.
   * Handles both BigDecimal and Double types.
   */
  private double convertToDouble(Object value) {
    if (value instanceof BigDecimal) {
      return ((BigDecimal) value).doubleValue();
    } else if (value instanceof Double) {
      return (Double) value;
    } else if (value instanceof Number) {
      return ((Number) value).doubleValue();
    } else {
      throw new IllegalArgumentException("Cannot convert " + value.getClass() + " to double");
    }
  }

  /**
   * Get routes serving a specific stop.
   * This is a placeholder - in a full implementation, this would query the route_stops table.
   */
  private List<String> getRoutesForStop(String stopId) {
    // TODO: Implement actual route lookup from route_stops table
    // For now, return sample data based on common MBTA stops
    return switch (stopId) {
      case "place-pktrm" -> List.of("Red", "Green-B", "Green-C", "Green-D", "Green-E");
      case "place-dwnxg" -> List.of("Orange", "Blue");
      case "place-harsq" -> List.of("Red");
      case "place-sstat" -> List.of("Red", "Silver");
      default -> List.of();
    };
  }

  /**
   * Search stops by name.
   */
  public List<StopDto> searchStopsByName(String name) {
    logger.info("Searching stops by name: {}", name);

    List<Stop> stops = stopRepository.findByNameContainingIgnoreCase(name);
    return stops.stream()
        .map(
            stop ->
                StopDto.of(
                    stop.getId(),
                    stop.getName(),
                    stop.getLatitude().doubleValue(),
                    stop.getLongitude().doubleValue(),
                    getRoutesForStop(stop.getId())))
        .toList();
  }

  /**
   * Get all major stations (location_type = 1).
   */
  @Cacheable("stops")
  public List<StopDto> getAllStations() {
    logger.info("Fetching all major stations");

    List<Stop> stations = stopRepository.findAllStations();
    return stations.stream()
        .map(
            station ->
                StopDto.of(
                    station.getId(),
                    station.getName(),
                    station.getLatitude().doubleValue(),
                    station.getLongitude().doubleValue(),
                    getRoutesForStop(station.getId())))
        .toList();
  }
}

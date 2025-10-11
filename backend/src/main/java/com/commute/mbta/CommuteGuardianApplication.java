package com.commute.mbta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for Commute Guardian MBTA service.
 * 
 * <p>This service provides:
 * - MBTA data ingestion (GTFS static + realtime)
 * - Reliability metrics computation
 * - Leave-now advice based on historical patterns
 */
@SpringBootApplication
@EnableCaching
@EnableScheduling
public class CommuteGuardianApplication {

  public static void main(String[] args) {
    SpringApplication.run(CommuteGuardianApplication.class, args);
  }
}

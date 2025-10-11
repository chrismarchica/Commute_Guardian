package com.commute.mbta.repository;

import com.commute.mbta.entity.Stop;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Repository for Stop entities with location-based queries. */
@Repository
public interface StopRepository extends JpaRepository<Stop, String> {

  /**
   * Find stops within a radius using the Haversine formula.
   * This is a simplified distance calculation suitable for small distances.
   * For production with PostGIS, this would use ST_DWithin.
   */
  @Query(
      value =
          """
      SELECT s.*, 
             (6371000 * acos(cos(radians(:lat)) * cos(radians(s.latitude)) 
                           * cos(radians(s.longitude) - radians(:lon)) 
                           + sin(radians(:lat)) * sin(radians(s.latitude)))) as distance
      FROM stops s
      WHERE (6371000 * acos(cos(radians(:lat)) * cos(radians(s.latitude)) 
                           * cos(radians(s.longitude) - radians(:lon)) 
                           + sin(radians(:lat)) * sin(radians(s.latitude)))) <= :radiusMeters
      ORDER BY distance
      LIMIT 50
      """,
      nativeQuery = true)
  List<Object[]> findNearbyStopsWithDistance(
      @Param("lat") double latitude,
      @Param("lon") double longitude,
      @Param("radiusMeters") int radiusMeters);

  /**
   * Find stops by name (case-insensitive partial match).
   */
  @Query("SELECT s FROM Stop s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%'))")
  List<Stop> findByNameContainingIgnoreCase(@Param("name") String name);

  /**
   * Find stops by parent station.
   */
  List<Stop> findByParentStation(String parentStation);

  /**
   * Find all station-level stops (location_type = 1).
   */
  @Query("SELECT s FROM Stop s WHERE s.locationType = 1")
  List<Stop> findAllStations();
}

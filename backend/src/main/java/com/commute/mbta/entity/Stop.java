package com.commute.mbta.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

/** JPA entity for MBTA stops. */
@Entity
@Table(name = "stops")
public class Stop {

  @Id
  @Column(name = "id", length = 50)
  private String id;

  @Column(name = "name", nullable = false, length = 100)
  private String name;

  @Column(name = "latitude", nullable = false, precision = 10, scale = 8)
  private BigDecimal latitude;

  @Column(name = "longitude", nullable = false, precision = 11, scale = 8)
  private BigDecimal longitude;

  @Column(name = "location_type")
  private Integer locationType = 0;

  @Column(name = "parent_station", length = 50)
  private String parentStation;

  @Column(name = "platform_code", length = 20)
  private String platformCode;

  @Column(name = "wheelchair_boarding")
  private Integer wheelchairBoarding = 0;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  // Default constructor
  public Stop() {}

  // Constructor with required fields
  public Stop(String id, String name, BigDecimal latitude, BigDecimal longitude) {
    this.id = id;
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.createdAt = Instant.now();
    this.updatedAt = Instant.now();
  }

  // Getters and setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public BigDecimal getLatitude() {
    return latitude;
  }

  public void setLatitude(BigDecimal latitude) {
    this.latitude = latitude;
  }

  public BigDecimal getLongitude() {
    return longitude;
  }

  public void setLongitude(BigDecimal longitude) {
    this.longitude = longitude;
  }

  public Integer getLocationType() {
    return locationType;
  }

  public void setLocationType(Integer locationType) {
    this.locationType = locationType;
  }

  public String getParentStation() {
    return parentStation;
  }

  public void setParentStation(String parentStation) {
    this.parentStation = parentStation;
  }

  public String getPlatformCode() {
    return platformCode;
  }

  public void setPlatformCode(String platformCode) {
    this.platformCode = platformCode;
  }

  public Integer getWheelchairBoarding() {
    return wheelchairBoarding;
  }

  public void setWheelchairBoarding(Integer wheelchairBoarding) {
    this.wheelchairBoarding = wheelchairBoarding;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}

package com.commute.mbta.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** JPA entity for MBTA routes. */
@Entity
@Table(name = "routes")
public class Route {

  @Id
  @Column(name = "id", length = 50)
  private String id;

  @Column(name = "short_name", length = 10)
  private String shortName;

  @Column(name = "long_name", nullable = false, length = 100)
  private String longName;

  @Column(name = "route_type", nullable = false)
  private Integer routeType;

  @Column(name = "color", length = 6)
  private String color;

  @Column(name = "text_color", length = 6)
  private String textColor;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  // Default constructor
  public Route() {}

  // Constructor with required fields
  public Route(String id, String longName, Integer routeType) {
    this.id = id;
    this.longName = longName;
    this.routeType = routeType;
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

  public String getShortName() {
    return shortName;
  }

  public void setShortName(String shortName) {
    this.shortName = shortName;
  }

  public String getLongName() {
    return longName;
  }

  public void setLongName(String longName) {
    this.longName = longName;
  }

  public Integer getRouteType() {
    return routeType;
  }

  public void setRouteType(Integer routeType) {
    this.routeType = routeType;
  }

  public String getColor() {
    return color;
  }

  public void setColor(String color) {
    this.color = color;
  }

  public String getTextColor() {
    return textColor;
  }

  public void setTextColor(String textColor) {
    this.textColor = textColor;
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

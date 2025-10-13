package com.commute.mbta.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Client for interacting with the MBTA API v3.
 * Handles authentication, rate limiting, and data parsing.
 */
@Service
public class MbtaApiClient {

  private static final Logger logger = LoggerFactory.getLogger(MbtaApiClient.class);

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;
  private final String baseUrl;
  private final String apiKey;
  private final Duration timeout;

  public MbtaApiClient(
      @Value("${mbta.api.base-url}") String baseUrl,
      @Value("${mbta.api.key}") String apiKey,
      @Value("${mbta.api.timeout}") Duration timeout) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(timeout)
        .build();
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Fetch all MBTA stops from the API.
   */
  public MbtaStopsResponse fetchAllStops() throws IOException, InterruptedException {
    String url = baseUrl + "/stops";
    logger.info("Fetching all stops from MBTA API: {}", url);

    HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .timeout(timeout)
        .GET();

    // Add API key if provided
    if (apiKey != null && !apiKey.trim().isEmpty()) {
      requestBuilder.header("X-API-Key", apiKey);
    }

    HttpRequest request = requestBuilder.build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      throw new IOException("MBTA API returned status " + response.statusCode() + ": " + response.body());
    }

    logger.info("Successfully fetched stops data from MBTA API");
    return objectMapper.readValue(response.body(), MbtaStopsResponse.class);
  }

  /**
   * Fetch all MBTA routes from the API.
   */
  public MbtaRoutesResponse fetchAllRoutes() throws IOException, InterruptedException {
    String url = baseUrl + "/routes";
    logger.info("Fetching all routes from MBTA API: {}", url);

    HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .timeout(timeout)
        .GET();

    // Add API key if provided
    if (apiKey != null && !apiKey.trim().isEmpty()) {
      requestBuilder.header("X-API-Key", apiKey);
    }

    HttpRequest request = requestBuilder.build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      throw new IOException("MBTA API returned status " + response.statusCode() + ": " + response.body());
    }

    logger.info("Successfully fetched routes data from MBTA API");
    return objectMapper.readValue(response.body(), MbtaRoutesResponse.class);
  }

  // Response DTOs for MBTA API

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class MbtaStopsResponse {
    @JsonProperty("data")
    public List<MbtaStop> data;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class MbtaRoutesResponse {
    @JsonProperty("data")
    public List<MbtaRoute> data;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class MbtaStop {
    @JsonProperty("id")
    public String id;

    @JsonProperty("attributes")
    public MbtaStopAttributes attributes;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class MbtaStopAttributes {
    @JsonProperty("name")
    public String name;

    @JsonProperty("latitude")
    public Double latitude;

    @JsonProperty("longitude")
    public Double longitude;

    @JsonProperty("location_type")
    public Integer locationType;

    @JsonProperty("parent_station")
    public String parentStation;

    @JsonProperty("platform_code")
    public String platformCode;

    @JsonProperty("wheelchair_boarding")
    public Integer wheelchairBoarding;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class MbtaRoute {
    @JsonProperty("id")
    public String id;

    @JsonProperty("attributes")
    public MbtaRouteAttributes attributes;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class MbtaRouteAttributes {
    @JsonProperty("short_name")
    public String shortName;

    @JsonProperty("long_name")
    public String longName;

    @JsonProperty("type")
    public Integer type;

    @JsonProperty("color")
    public String color;

    @JsonProperty("text_color")
    public String textColor;
  }
}

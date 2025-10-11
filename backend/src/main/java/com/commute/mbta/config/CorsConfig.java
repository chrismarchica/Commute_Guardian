package com.commute.mbta.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** CORS configuration for allowing frontend access. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

  @Value("${cors.allowed-origins}")
  private String[] allowedOrigins;

  @Value("${cors.allowed-methods}")
  private String[] allowedMethods;

  @Value("${cors.allowed-headers}")
  private String allowedHeaders;

  @Value("${cors.allow-credentials}")
  private boolean allowCredentials;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods(allowedMethods)
        .allowedHeaders(allowedHeaders)
        .allowCredentials(allowCredentials)
        .maxAge(3600);

    // Also allow CORS for admin endpoints
    registry
        .addMapping("/admin/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods("GET", "POST")
        .allowedHeaders(allowedHeaders)
        .allowCredentials(allowCredentials)
        .maxAge(3600);
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(java.util.List.of(allowedOrigins));
    configuration.setAllowedMethods(java.util.List.of(allowedMethods));
    configuration.setAllowedHeaders(java.util.List.of(allowedHeaders.split(",")));
    configuration.setAllowCredentials(allowCredentials);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}

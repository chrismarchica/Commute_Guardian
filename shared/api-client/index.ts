/**
 * Shared API client types and utilities for Commute Guardian
 * 
 * This file contains TypeScript types generated from the backend OpenAPI specification.
 * In a production setup, this would be auto-generated using openapi-typescript or similar tools.
 */

// Re-export all types from the frontend API client for consistency
export type {
  HealthResponse,
  Stop,
  ReliabilityMetrics,
  EtaPrediction,
  EtaResponse,
  DepartureWindow,
  RiskAssessment,
  LeaveNowAdvice,
  ApiError,
} from '../../frontend/src/lib/api-client'

// Additional shared types that might be used across multiple clients

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ServiceAlert {
  id: string
  cause: string
  effect: string
  headerText: string
  descriptionText?: string
  url?: string
  activePeriodStart?: string
  activePeriodEnd?: string
  affectedRoutes: string[]
  affectedStops: string[]
}

export interface RealtimeTripUpdate {
  id: number
  timestamp: string
  tripId?: string
  routeId: string
  stopId: string
  delaySeconds?: number
  vehicleId?: string
  scheduleRelationship: 'SCHEDULED' | 'SKIPPED' | 'NO_DATA'
}

export interface VehiclePosition {
  id: number
  timestamp: string
  vehicleId: string
  tripId?: string
  routeId?: string
  latitude?: number
  longitude?: number
  bearing?: number
  speed?: number
  currentStopSequence?: number
  currentStatus?: 'IN_TRANSIT_TO' | 'STOPPED_AT' | 'INCOMING_AT'
  occupancyStatus?: string
}

export interface RouteInfo {
  id: string
  shortName?: string
  longName: string
  routeType: number
  color?: string
  textColor?: string
}

export interface TripInfo {
  id: string
  routeId: string
  serviceId: string
  headsign?: string
  directionId: number
  blockId?: string
  shapeId?: string
}

export interface StopTime {
  id: number
  tripId: string
  stopId: string
  arrivalTime?: string
  departureTime?: string
  stopSequence: number
  pickupType: number
  dropOffType: number
  timepoint: number
}

// Utility types for API operations
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestConfig {
  method: HttpMethod
  url: string
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
  timeout?: number
}

// Constants for API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  STOPS: {
    NEAR: '/api/stops/near',
    SEARCH: '/api/stops/search',
  },
  ROUTES: {
    LIST: '/api/routes',
    RELIABILITY: (routeId: string) => `/api/routes/${routeId}/reliability`,
  },
  ETA: '/api/eta',
  LEAVE_NOW: '/api/leave-now',
  ADMIN: {
    LOAD_STATIC: '/admin/loadStatic',
    REPLAY_FIXTURES: '/admin/replayFixtures',
    STOP_REPLAY: '/admin/stopReplay',
  },
} as const

// Error codes that might be returned by the API
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

// Risk level constants
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS]

// Confidence level constants
export const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const

export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[keyof typeof CONFIDENCE_LEVELS]

// MBTA route type constants (from GTFS specification)
export const ROUTE_TYPES = {
  TRAM: 0,
  SUBWAY: 1,
  RAIL: 2,
  BUS: 3,
  FERRY: 4,
  CABLE_TRAM: 5,
  AERIAL_LIFT: 6,
  FUNICULAR: 7,
} as const

export type RouteType = typeof ROUTE_TYPES[keyof typeof ROUTE_TYPES]

// MBTA-specific route colors
export const MBTA_ROUTE_COLORS = {
  Red: '#DA291C',
  Orange: '#ED8B00',
  Blue: '#003DA5',
  'Green-B': '#00843D',
  'Green-C': '#00843D',
  'Green-D': '#00843D',
  'Green-E': '#00843D',
  Silver: '#7C878E',
  Purple: '#80276C',
} as const

// Utility functions that might be shared across clients
export const utils = {
  /**
   * Format a route ID for display
   */
  formatRouteId: (routeId: string): string => {
    if (routeId.includes('Green-')) {
      const branch = routeId.split('-')[1]
      return `Green Line ${branch?.toUpperCase()}`
    }
    return `${routeId} Line`
  },

  /**
   * Get route color by ID
   */
  getRouteColor: (routeId: string): string => {
    return MBTA_ROUTE_COLORS[routeId as keyof typeof MBTA_ROUTE_COLORS] || '#6B7280'
  },

  /**
   * Check if a route is a Green Line branch
   */
  isGreenLine: (routeId: string): boolean => {
    return routeId.startsWith('Green-')
  },

  /**
   * Parse GTFS time format (HH:MM:SS) to minutes since midnight
   */
  parseGtfsTime: (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number)
    return hours * 60 + minutes + (seconds || 0) / 60
  },

  /**
   * Format minutes since midnight back to time string
   */
  formatGtfsTime: (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    const secs = Math.floor((minutes % 1) * 60)
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
}

// Default export for convenience
export default {
  API_ENDPOINTS,
  API_ERROR_CODES,
  RISK_LEVELS,
  CONFIDENCE_LEVELS,
  ROUTE_TYPES,
  MBTA_ROUTE_COLORS,
  utils,
}

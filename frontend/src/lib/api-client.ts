/**
 * API client for Commute Guardian backend
 * Handles HTTP requests with proper error handling and type safety
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export interface ApiError {
  message: string
  status: number
  details?: any
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          details: errorData,
        } as ApiError
      }

      const data = await response.json()
      return { data, status: response.status }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: 'Network error - unable to connect to server',
          status: 0,
          details: error,
        } as ApiError
      }
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>) {
    const url = new URL(endpoint, this.baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    return this.request<T>(url.pathname + url.search)
  }

  async post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// Default API client instance
export const apiClient = new ApiClient()

// Type definitions for API responses
export interface HealthResponse {
  status: string
  timestamp: string
  service: string
  version: string
}

export interface RouteInfo {
  name: string
  type: number // 0=Tram, 1=Subway, 2=Rail, 3=Bus
  direction: string // Direction or destination (e.g., "Ashmont/Braintree", "Boston College")
}

export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  distanceMeters?: number
  routes: RouteInfo[]
}

export interface ReliabilityMetrics {
  routeId: string
  dayOfWeek?: string
  hour?: number
  overall: {
    samples: number
    medianDelaySeconds: number
    p90DelaySeconds: number
    onTimePercentage: number
    headwayStdSeconds: number
  }
  stops: Array<{
    stopId: string
    stopName: string
    samples: number
    medianDelaySeconds: number
    p90DelaySeconds: number
    onTimePercentage: number
  }>
}

export interface EtaPrediction {
  routeId: string
  routeName: string
  headsign: string
  arrivalTime: string
  minutesAway: number
  delaySeconds?: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface EtaResponse {
  stopId: string
  stopName: string
  routeId?: string
  timestamp: string
  predictions: EtaPrediction[]
}

export interface DepartureWindow {
  departureTime: string
  expectedArrival: string
  durationMinutes: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  advice: string
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  historicalOnTime: number
  serviceAlerts: string[]
  riskFactors: string[]
}

export interface LeaveNowAdvice {
  fromStopId: string
  toStopId: string
  routeId?: string
  timestamp: string
  departureWindows: DepartureWindow[]
  riskAssessment: RiskAssessment
}

// API service functions
export const api = {
  // Health check
  health: () => apiClient.get<HealthResponse>('/api/health'),

  // Stops
  nearbyStops: (lat: number, lon: number, radius: number = 500) =>
    apiClient.get<Stop[]>('/api/stops/near', { lat, lon, radius }),

  // Routes and reliability
  routeReliability: (routeId: string, dow?: string, hour?: number) =>
    apiClient.get<ReliabilityMetrics>(`/api/routes/${routeId}/reliability`, { dow, hour }),

  // ETA predictions
  eta: (stopId: string, routeId?: string) =>
    apiClient.get<EtaResponse>('/api/eta', { stopId, routeId }),

  // Leave-now advice
  leaveNowAdvice: (fromStop: string, toStop: string, routeId?: string) =>
    apiClient.get<LeaveNowAdvice>('/api/leave-now', { fromStop, toStop, routeId }),

  // Admin functions
  admin: {
    loadStatic: (source: string = 'file') =>
      apiClient.post<{ status: string; message: string; details: string }>('/admin/loadStatic', { source }),
    
    replayFixtures: (speed: number = 10) =>
      apiClient.post<{ status: string; message: string; details: string; speed: string }>('/admin/replayFixtures', { speed }),
    
    stopReplay: () =>
      apiClient.post<{ status: string; message: string }>('/admin/stopReplay'),
  },
}

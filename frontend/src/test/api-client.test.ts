import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiClient, api } from '@/lib/api-client'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient('http://localhost:8080')
    mockFetch.mockClear()
  })

  describe('health endpoint', () => {
    it('should return health status', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00Z',
        service: 'commute-guardian-backend',
        version: '1.0.0',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await api.health()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/health',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result.data).toEqual(mockResponse)
      expect(result.status).toBe(200)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'))

      await expect(api.health()).rejects.toMatchObject({
        message: 'Network error - unable to connect to server',
        status: 0,
      })
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      })

      await expect(api.health()).rejects.toMatchObject({
        message: 'Server error',
        status: 500,
      })
    })
  })

  describe('nearby stops endpoint', () => {
    it('should fetch nearby stops with correct parameters', async () => {
      const mockStops = [
        {
          id: 'place-pktrm',
          name: 'Park Street',
          latitude: 42.3561,
          longitude: -71.0624,
          distanceMeters: 150.5,
          routes: ['Red', 'Green-B', 'Green-C'],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStops,
      })

      const result = await api.nearbyStops(42.3561, -71.0624, 500)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/stops/near?lat=42.3561&lon=-71.0624&radius=500',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result.data).toEqual(mockStops)
    })
  })

  describe('route reliability endpoint', () => {
    it('should fetch route reliability metrics', async () => {
      const mockMetrics = {
        routeId: 'Red',
        dayOfWeek: 'MON',
        hour: 8,
        overall: {
          samples: 1250,
          medianDelaySeconds: 45,
          p90DelaySeconds: 180,
          onTimePercentage: 0.78,
          headwayStdSeconds: 120.5,
        },
        stops: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMetrics,
      })

      const result = await api.routeReliability('Red', 'MON', 8)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/routes/Red/reliability?dow=MON&hour=8',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result.data).toEqual(mockMetrics)
    })
  })

  describe('leave-now advice endpoint', () => {
    it('should fetch leave-now advice', async () => {
      const mockAdvice = {
        fromStopId: 'place-pktrm',
        toStopId: 'place-harsq',
        routeId: 'Red',
        timestamp: '2024-01-15T14:30:00Z',
        departureWindows: [
          {
            departureTime: '2024-01-15T14:35:00Z',
            expectedArrival: '2024-01-15T14:55:00Z',
            durationMinutes: 20,
            riskLevel: 'LOW' as const,
            confidence: 0.85,
            advice: 'Leave now for best reliability',
          },
        ],
        riskAssessment: {
          overallRisk: 'MEDIUM' as const,
          historicalOnTime: 0.78,
          serviceAlerts: [],
          riskFactors: ['Peak commuting hours'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAdvice,
      })

      const result = await api.leaveNowAdvice('place-pktrm', 'place-harsq', 'Red')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/leave-now?fromStop=place-pktrm&toStop=place-harsq&routeId=Red',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result.data).toEqual(mockAdvice)
    })
  })
})

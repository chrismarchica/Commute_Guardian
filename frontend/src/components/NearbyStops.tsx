'use client'

import { useQuery } from '@tanstack/react-query'
import { MapPin, Navigation, Clock } from 'lucide-react'
import { api, type Stop } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface NearbyStopsProps {
  latitude: number
  longitude: number
  onStopSelect: (stopId: string) => void
  selectedStop: string | null
}

export function NearbyStops({ latitude, longitude, onStopSelect, selectedStop }: NearbyStopsProps) {
  const { data: stops, isLoading, error } = useQuery({
    queryKey: ['nearby-stops', latitude, longitude],
    queryFn: () => api.nearbyStops(latitude, longitude, 800),
    enabled: !!(latitude && longitude),
  })

  const getRouteColor = (route: string): string => {
    const routeLower = route.toLowerCase()
    if (routeLower.includes('red')) return 'bg-mbta-red'
    if (routeLower.includes('orange')) return 'bg-mbta-orange'
    if (routeLower.includes('blue')) return 'bg-mbta-blue'
    if (routeLower.includes('green')) return 'bg-mbta-green'
    if (routeLower.includes('silver')) return 'bg-mbta-silver'
    if (routeLower.includes('purple')) return 'bg-mbta-purple'
    return 'bg-gray-500'
  }

  const formatDistance = (meters?: number): string => {
    if (!meters) return ''
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-mbta-blue" />
            Nearby Stops
          </h2>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="loading-skeleton h-16 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-mbta-blue" />
            Nearby Stops
          </h2>
        </div>
        <div className="card-content">
          <div className="text-center py-6">
            <p className="text-red-600 mb-2">Unable to load nearby stops</p>
            <p className="text-sm text-gray-500">Please check your connection and try again</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stops?.data || stops.data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-mbta-blue" />
            Nearby Stops
          </h2>
        </div>
        <div className="card-content">
          <div className="text-center py-6">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No MBTA stops found nearby</p>
            <p className="text-sm text-gray-500">Try a different location or increase search radius</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Navigation className="w-5 h-5 mr-2 text-mbta-blue" />
          Nearby Stops
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Found {stops.data.length} stops within 800m
        </p>
      </div>
      <div className="card-content">
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {stops.data.map((stop) => (
            <button
              key={stop.id}
              onClick={() => onStopSelect(stop.id)}
              className={cn(
                'w-full text-left p-3 rounded-md border transition-all hover:shadow-sm',
                selectedStop === stop.id
                  ? 'border-mbta-blue bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {stop.name}
                  </h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      {formatDistance(stop.distanceMeters)}
                    </span>
                    {stop.routes.length > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center space-x-1">
                          {stop.routes.slice(0, 3).map((route) => (
                            <span
                              key={route}
                              className={cn(
                                'inline-block px-1.5 py-0.5 text-xs font-medium text-white rounded',
                                getRouteColor(route)
                              )}
                            >
                              {route}
                            </span>
                          ))}
                          {stop.routes.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{stop.routes.length - 3}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {selectedStop === stop.id && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-mbta-blue rounded-full" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="card-footer">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Click a stop to view reliability data</span>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  )
}

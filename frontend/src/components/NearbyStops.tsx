'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Navigation, Clock, Train, Bus } from 'lucide-react'
import { api, type Stop } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type FilterMode = 'subway' | 'bus'

interface NearbyStopsProps {
  latitude: number
  longitude: number
  onStopSelect: (stopId: string) => void
  selectedStop: string | null
}

export function NearbyStops({ latitude, longitude, onStopSelect, selectedStop }: NearbyStopsProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('subway')
  
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

  const filterStops = (stops: Stop[], mode: FilterMode): Stop[] => {
    return stops.filter(stop => {
      if (mode === 'subway') {
        // Show stops with tram (0) or subway (1) routes
        return stop.routes.some(r => r.type === 0 || r.type === 1)
      } else {
        // Show stops with bus (3) routes
        return stop.routes.some(r => r.type === 3)
      }
    })
  }

  const getStopDirections = (stop: Stop, mode: FilterMode): string[] => {
    const relevantRoutes = stop.routes.filter(r => {
      if (mode === 'subway') {
        return r.type === 0 || r.type === 1
      } else {
        return r.type === 3
      }
    })
    
    // Get unique directions
    const directions = new Set(relevantRoutes.map(r => r.direction).filter(Boolean))
    return Array.from(directions)
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

  const filteredStops = filterStops(stops.data, filterMode)

  const renderStopButton = (stop: Stop) => {
    const directions = getStopDirections(stop, filterMode)
    const relevantRoutes = stop.routes.filter(r => {
      if (filterMode === 'subway') {
        return r.type === 0 || r.type === 1
      } else {
        return r.type === 3
      }
    })

    return (
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
            {directions.length > 0 && (
              <div className="text-xs text-gray-600 mt-0.5 truncate">
                → {directions.join(' • ')}
              </div>
            )}
            <div className="flex items-center mt-1 space-x-2">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">
                {formatDistance(stop.distanceMeters)}
              </span>
              {relevantRoutes.length > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center space-x-1">
                    {relevantRoutes.slice(0, 3).map((route, idx) => (
                      <span
                        key={`${route.name}-${idx}`}
                        className={cn(
                          'inline-block px-1.5 py-0.5 text-xs font-medium text-white rounded',
                          getRouteColor(route.name)
                        )}
                      >
                        {route.name}
                      </span>
                    ))}
                    {relevantRoutes.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{relevantRoutes.length - 3}
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
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-mbta-blue" />
              Nearby Stops
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {filteredStops.length} {filterMode === 'subway' ? 'subway/rail' : 'bus'} stops within 800m
            </p>
          </div>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilterMode('subway')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filterMode === 'subway'
                ? 'bg-mbta-red text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Train className="w-4 h-4" />
            <span>Subway & Rail</span>
          </button>
          <button
            onClick={() => setFilterMode('bus')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filterMode === 'bus'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Bus className="w-4 h-4" />
            <span>Bus</span>
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {filteredStops.length > 0 ? (
            filteredStops.map(renderStopButton)
          ) : (
            <div className="text-center py-8">
              {filterMode === 'subway' ? (
                <Train className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              ) : (
                <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              )}
              <p className="text-gray-600 mb-1">
                No {filterMode === 'subway' ? 'subway or rail' : 'bus'} stops found nearby
              </p>
              <p className="text-sm text-gray-500">
                Try switching to {filterMode === 'subway' ? 'bus' : 'subway'} stops or a different location
              </p>
            </div>
          )}
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

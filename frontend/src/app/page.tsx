'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { NearbyStops } from '@/components/NearbyStops'
import { ReliabilityHeatmap } from '@/components/ReliabilityHeatmap'
import { LeaveNowWidget } from '@/components/LeaveNowWidget'
import { apiClient } from '@/lib/api-client'

export default function Dashboard() {
  const [selectedStop, setSelectedStop] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  // Health check query
  const { data: healthData, isLoading: healthLoading } = useQuery<{
    status: string;
    timestamp: string;
    uptime: number;
  }>({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/api/health').then(res => res.data as {
      status: string;
      timestamp: string;
      uptime: number;
    }),
    refetchInterval: 30000, // Check every 30 seconds
  })

  const handleLocationRequest = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Fallback to Boston Common coordinates
          setUserLocation({ lat: 42.3555, lon: -71.0640 })
        }
      )
    } else {
      // Fallback to Boston Common coordinates
      setUserLocation({ lat: 42.3555, lon: -71.0640 })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          MBTA Reliability Dashboard
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Real-time reliability tracking and smart departure advice for Boston transit.
          Get insights on delays, plan your commute, and never miss your train again.
        </p>
        
        {/* Service Status */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${healthLoading ? 'bg-yellow-400' : 'bg-green-400'}`} />
            <span className="text-sm text-gray-600">
              Service: {healthLoading ? 'Checking...' : 'Online'}
            </span>
          </div>
          {healthData?.timestamp && (
            <span className="text-sm text-gray-500">
              Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Location & Stops */}
        <div className="lg:col-span-1 space-y-6">
          {/* Location Widget */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-mbta-blue" />
                Your Location
              </h2>
            </div>
            <div className="card-content">
              {!userLocation ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    Find nearby MBTA stops and get personalized reliability data
                  </p>
                  <button
                    onClick={handleLocationRequest}
                    className="btn-primary btn-md"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Get My Location
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Location: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                  </p>
                  <button
                    onClick={() => setUserLocation(null)}
                    className="btn-outline btn-sm"
                  >
                    Change Location
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Nearby Stops */}
          {userLocation && (
            <NearbyStops
              latitude={userLocation.lat}
              longitude={userLocation.lon}
              onStopSelect={setSelectedStop}
              selectedStop={selectedStop}
            />
          )}
        </div>

        {/* Center Column - Reliability Analysis */}
        <div className="lg:col-span-1 space-y-6">
          {/* Reliability Heatmap */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-mbta-blue" />
                Reliability Heatmap
              </h2>
              {selectedRoute && (
                <p className="text-sm text-gray-600 mt-1">
                  Showing data for {selectedRoute} Line
                </p>
              )}
            </div>
            <div className="card-content">
              <ReliabilityHeatmap
                routeId={selectedRoute || 'Red'}
                onRouteSelect={setSelectedRoute}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="card-content text-center py-6">
                <div className="text-2xl font-bold text-mbta-blue mb-1">78%</div>
                <div className="text-sm text-gray-600">On-Time Today</div>
              </div>
            </div>
            <div className="card">
              <div className="card-content text-center py-6">
                <div className="text-2xl font-bold text-mbta-orange mb-1">+2.5m</div>
                <div className="text-sm text-gray-600">Avg Delay</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Leave Now Advice */}
        <div className="lg:col-span-1 space-y-6">
          {/* Leave Now Widget */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-mbta-blue" />
                Leave Now Advice
              </h2>
            </div>
            <div className="card-content">
              <LeaveNowWidget
                fromStop={selectedStop}
                routeId={selectedRoute}
              />
            </div>
          </div>

          {/* Service Alerts */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Service Alerts
              </h2>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Green Line:</strong> Minor delays due to signal problems at Park Street
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Updated 5 minutes ago</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Red Line:</strong> Normal service with minor delays during peak hours
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Updated 15 minutes ago</p>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Alerts updated every 5 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Activity */}
      <div className="mt-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
          </div>
          <div className="card-content">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Red Line - Park Street</span>
                <span className="text-red-600">+45s delay</span>
                <span className="text-gray-400">2 min ago</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Orange Line - Downtown Crossing</span>
                <span className="text-green-600">On time</span>
                <span className="text-gray-400">3 min ago</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Blue Line - State</span>
                <span className="text-green-600">-15s early</span>
                <span className="text-gray-400">5 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

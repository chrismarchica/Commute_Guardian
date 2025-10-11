'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Calendar, Clock } from 'lucide-react'
import { api, type ReliabilityMetrics } from '@/lib/api-client'
import { formatPercentage, getReliabilityStatus } from '@/lib/utils'

interface ReliabilityHeatmapProps {
  routeId: string
  onRouteSelect: (routeId: string) => void
}

const MBTA_ROUTES = [
  { id: 'Red', name: 'Red Line', color: '#DA291C' },
  { id: 'Orange', name: 'Orange Line', color: '#ED8B00' },
  { id: 'Blue', name: 'Blue Line', color: '#003DA5' },
  { id: 'Green-B', name: 'Green Line B', color: '#00843D' },
  { id: 'Green-C', name: 'Green Line C', color: '#00843D' },
]

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function ReliabilityHeatmap({ routeId, onRouteSelect }: ReliabilityHeatmapProps) {
  const { data: reliability, isLoading, error } = useQuery({
    queryKey: ['route-reliability', routeId],
    queryFn: () => api.routeReliability(routeId),
    enabled: !!routeId,
  })

  // Generate hourly data for the current day (simplified for demo)
  const generateHourlyData = (metrics?: ReliabilityMetrics) => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map(hour => {
      // Simulate different reliability patterns throughout the day
      let onTimePercentage = 0.75 // Base reliability
      
      // Rush hours have lower reliability
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        onTimePercentage -= 0.15
      }
      
      // Late night/early morning has higher reliability
      if (hour < 6 || hour > 22) {
        onTimePercentage += 0.1
      }
      
      // Add some route-specific variation
      if (routeId.includes('Green')) {
        onTimePercentage -= 0.1 // Green line is generally less reliable
      } else if (routeId === 'Blue') {
        onTimePercentage += 0.05 // Blue line is more reliable
      }
      
      // Clamp between 0.4 and 0.95
      onTimePercentage = Math.max(0.4, Math.min(0.95, onTimePercentage))
      
      return {
        hour,
        onTimePercentage,
        label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        samples: Math.floor(Math.random() * 100) + 50,
        medianDelay: Math.floor(Math.random() * 120) + 30,
      }
    })
  }

  const hourlyData = generateHourlyData(reliability?.data)

  const getBarColor = (onTimePercentage: number) => {
    if (onTimePercentage >= 0.8) return '#10B981' // Green
    if (onTimePercentage >= 0.6) return '#F59E0B' // Amber
    return '#EF4444' // Red
  }

  const selectedRoute = MBTA_ROUTES.find(route => route.id === routeId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="loading-skeleton h-8 w-48" />
        <div className="loading-skeleton h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-red-600 mb-2">Unable to load reliability data</p>
        <p className="text-sm text-gray-500">Please try again later</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Route Selector */}
      <div className="flex flex-wrap gap-2">
        {MBTA_ROUTES.map((route) => (
          <button
            key={route.id}
            onClick={() => onRouteSelect(route.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              routeId === route.id
                ? 'text-white shadow-sm'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
            style={routeId === route.id ? { backgroundColor: route.color } : {}}
          >
            {route.name}
          </button>
        ))}
      </div>

      {/* Overall Stats */}
      {reliability?.data && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(reliability.data.overall.onTimePercentage)}
            </div>
            <div className="text-sm text-gray-600">On-Time Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(reliability.data.overall.medianDelaySeconds / 60)}m
            </div>
            <div className="text-sm text-gray-600">Median Delay</div>
          </div>
        </div>
      )}

      {/* Hourly Reliability Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Today's Reliability by Hour
          </h3>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1" />
              <span>High (80%+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-1" />
              <span>Medium (60-80%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-1" />
              <span>Low (&lt;60%)</span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hour"
                tick={{ fontSize: 10 }}
                tickFormatter={(hour) => hour === 0 ? '12A' : hour < 12 ? `${hour}A` : hour === 12 ? '12P' : `${hour-12}P`}
              />
              <YAxis 
                domain={[0.4, 1]}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const status = getReliabilityStatus(data.onTimePercentage)
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900">{data.label}</p>
                        <p className={`text-sm ${status.color}`}>
                          {formatPercentage(data.onTimePercentage)} on-time
                        </p>
                        <p className="text-xs text-gray-500">
                          {data.samples} samples • {data.medianDelay}s median delay
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="onTimePercentage" radius={[2, 2, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.onTimePercentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Pattern Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          Weekly Pattern (8 AM)
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((day, index) => {
            // Simulate weekly patterns
            let reliability = 0.75
            if (index >= 5) reliability += 0.1 // Weekends are better
            if (index === 1) reliability -= 0.05 // Tuesday is slightly worse
            
            const status = getReliabilityStatus(reliability)
            
            return (
              <div key={day} className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs font-medium text-gray-700">{day}</div>
                <div className={`text-sm font-bold ${status.color}`}>
                  {formatPercentage(reliability, 0)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { formatPercentage, formatDelay, getReliabilityStatus } from '@/lib/utils'

const ROUTE_COLORS: Record<string, string> = {
  'Red': '#DA291C',
  'Orange': '#ED8B00',
  'Blue': '#003DA5',
  'Green-B': '#00843D',
  'Green-C': '#00843D',
  'Green-D': '#00843D',
  'Green-E': '#00843D',
  'Silver': '#7C878E',
  'Purple': '#80276C',
}

export default function RoutePage() {
  const params = useParams()
  const routeId = params.routeId as string

  const { data: reliability, isLoading, error } = useQuery({
    queryKey: ['route-reliability-detail', routeId],
    queryFn: () => api.routeReliability(routeId),
    enabled: !!routeId,
  })

  const routeColor = ROUTE_COLORS[routeId] || '#6B7280'
  const routeName = routeId.includes('Green') 
    ? `Green Line ${routeId.split('-')[1]?.toUpperCase() || ''}` 
    : `${routeId} Line`

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="loading-skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="loading-skeleton h-64" />
          <div className="loading-skeleton h-64" />
          <div className="loading-skeleton h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Route Not Found</h1>
          <p className="text-gray-600 mb-4">
            Unable to load reliability data for {routeName}
          </p>
          <Link href="/" className="btn-primary btn-md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const metrics = reliability?.data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center space-x-4 mb-4">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: routeColor }}
          >
            {routeId.includes('Green') ? routeId.split('-')[1] || 'G' : routeId[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{routeName}</h1>
            <p className="text-gray-600">Route reliability and performance metrics</p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-content text-center py-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatPercentage(metrics.overall.onTimePercentage)}
              </div>
              <div className="text-sm text-gray-600">On-Time Performance</div>
              <div className={`text-xs mt-1 ${getReliabilityStatus(metrics.overall.onTimePercentage).color}`}>
                {getReliabilityStatus(metrics.overall.onTimePercentage).label}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center py-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatDelay(metrics.overall.medianDelaySeconds)}
              </div>
              <div className="text-sm text-gray-600">Median Delay</div>
              <div className="text-xs text-gray-500 mt-1">
                90th percentile: {formatDelay(metrics.overall.p90DelaySeconds)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center py-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {Math.round(metrics.overall.headwayStdSeconds / 60)}m
              </div>
              <div className="text-sm text-gray-600">Headway Variation</div>
              <div className="text-xs text-gray-500 mt-1">
                Standard deviation
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center py-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {metrics.overall.samples.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Data Samples</div>
              <div className="text-xs text-gray-500 mt-1">
                Last 30 days
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop-by-Stop Breakdown */}
      {metrics && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" style={{ color: routeColor }} />
              Stop-by-Stop Reliability
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Performance metrics for each stop on the {routeName}
            </p>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stop
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-Time %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Median Delay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      90th Percentile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Samples
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.stops.map((stop) => {
                    const status = getReliabilityStatus(stop.onTimePercentage)
                    return (
                      <tr key={stop.stopId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: routeColor }}
                              />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {stop.stopName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stop.stopId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPercentage(stop.onTimePercentage)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDelay(stop.medianDelaySeconds)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDelay(stop.p90DelaySeconds)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {stop.samples}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            status.level === 'high' 
                              ? 'bg-green-100 text-green-800'
                              : status.level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Trends */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Peak Hour Performance
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Morning Rush (7-9 AM)</div>
                  <div className="text-sm text-gray-600">Weekday average</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">68%</div>
                  <div className="text-xs text-gray-500">on-time</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Evening Rush (5-7 PM)</div>
                  <div className="text-sm text-gray-600">Weekday average</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">72%</div>
                  <div className="text-xs text-gray-500">on-time</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Off-Peak Hours</div>
                  <div className="text-sm text-gray-600">10 AM - 4 PM</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">85%</div>
                  <div className="text-xs text-gray-500">on-time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              Service Insights
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Best Performance</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Weekends and late evenings show the highest reliability rates
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium text-gray-900">Peak Challenges</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Morning rush hour experiences the most significant delays
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900">Improvement Trend</h4>
                <p className="text-sm text-gray-600 mt-1">
                  On-time performance has improved 5% over the last quarter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

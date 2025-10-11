'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, ArrowRight, AlertTriangle, CheckCircle, MapPin } from 'lucide-react'
import { api, type LeaveNowAdvice } from '@/lib/api-client'
import { formatTime, formatRelativeTime, getRiskStyling, cn } from '@/lib/utils'

interface LeaveNowWidgetProps {
  fromStop: string | null
  routeId?: string | null
}

export function LeaveNowWidget({ fromStop, routeId }: LeaveNowWidgetProps) {
  const [toStop, setToStop] = useState<string>('place-harsq') // Default to Harvard
  const [isAdviceEnabled, setIsAdviceEnabled] = useState(false)

  const { data: advice, isLoading, error } = useQuery({
    queryKey: ['leave-now-advice', fromStop, toStop, routeId],
    queryFn: () => api.leaveNowAdvice(fromStop!, toStop, routeId || undefined),
    enabled: !!(fromStop && toStop && isAdviceEnabled),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const commonDestinations = [
    { id: 'place-harsq', name: 'Harvard' },
    { id: 'place-sstat', name: 'South Station' },
    { id: 'place-north', name: 'North Station' },
    { id: 'place-dwnxg', name: 'Downtown Crossing' },
    { id: 'place-pktrm', name: 'Park Street' },
  ]

  const handleGetAdvice = () => {
    if (fromStop && toStop) {
      setIsAdviceEnabled(true)
    }
  }

  if (!fromStop) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">Select a nearby stop first</p>
        <p className="text-sm text-gray-500">
          Choose your origin stop to get personalized departure advice
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Destination Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Where are you going?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {commonDestinations
            .filter(dest => dest.id !== fromStop)
            .slice(0, 4)
            .map((destination) => (
            <button
              key={destination.id}
              onClick={() => setToStop(destination.id)}
              className={cn(
                'text-left p-2 rounded-md border transition-all text-sm',
                toStop === destination.id
                  ? 'border-mbta-blue bg-blue-50 text-mbta-blue'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                {destination.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Get Advice Button */}
      {!isAdviceEnabled && (
        <button
          onClick={handleGetAdvice}
          disabled={!fromStop || !toStop}
          className="w-full btn-primary btn-md"
        >
          <Clock className="w-4 h-4 mr-2" />
          Get Leave-Now Advice
        </button>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          <div className="loading-skeleton h-20 rounded-md" />
          <div className="loading-skeleton h-16 rounded-md" />
          <div className="loading-skeleton h-16 rounded-md" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm mb-2">Unable to get advice</p>
          <button
            onClick={() => setIsAdviceEnabled(false)}
            className="btn-outline btn-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Advice Results */}
      {advice?.data && (
        <div className="space-y-4">
          {/* Overall Risk Assessment */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Journey Risk</span>
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getRiskStyling(advice.data.riskAssessment.overallRisk).bgColor,
                getRiskStyling(advice.data.riskAssessment.overallRisk).textColor
              )}>
                {getRiskStyling(advice.data.riskAssessment.overallRisk).label}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Historical on-time: {Math.round(advice.data.riskAssessment.historicalOnTime * 100)}%
            </p>
            {advice.data.riskAssessment.riskFactors.length > 0 && (
              <div className="mt-2 space-y-1">
                {advice.data.riskAssessment.riskFactors.slice(0, 2).map((factor, index) => (
                  <p key={index} className="text-xs text-gray-500 flex items-start">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {factor}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Departure Windows */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Recommended Departures</h3>
            {advice.data.departureWindows.map((window, index) => {
              const riskStyling = getRiskStyling(window.riskLevel)
              const isRecommended = index === 0 || window.riskLevel === 'LOW'
              
              return (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    isRecommended
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {formatTime(window.departureTime)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-700">
                          {formatTime(window.expectedArrival)}
                        </span>
                        {isRecommended && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {window.durationMinutes} min journey • {formatRelativeTime(window.departureTime)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        riskStyling.bgColor,
                        riskStyling.textColor
                      )}>
                        {riskStyling.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(window.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">
                    {window.advice}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Service Alerts */}
          {advice.data.riskAssessment.serviceAlerts.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Active Alerts</p>
                  {advice.data.riskAssessment.serviceAlerts.map((alert, index) => (
                    <p key={index} className="text-xs text-yellow-700">
                      {alert}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Refresh Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              Updated {formatRelativeTime(advice.data.timestamp)}
            </span>
            <button
              onClick={() => setIsAdviceEnabled(false)}
              className="btn-outline btn-sm"
            >
              New Journey
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

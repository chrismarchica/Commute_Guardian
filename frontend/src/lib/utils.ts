import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format seconds into human-readable time
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Format delay in seconds to human-readable string
 */
export function formatDelay(delaySeconds: number): string {
  if (delaySeconds === 0) return 'On time'
  
  const absDelay = Math.abs(delaySeconds)
  const sign = delaySeconds > 0 ? '+' : '-'
  
  if (absDelay < 60) {
    return `${sign}${absDelay}s`
  }
  
  const minutes = Math.floor(absDelay / 60)
  const seconds = absDelay % 60
  
  if (seconds === 0) {
    return `${sign}${minutes}m`
  }
  
  return `${sign}${minutes}m ${seconds}s`
}

/**
 * Format percentage as string with appropriate precision
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Get reliability status based on on-time percentage
 */
export function getReliabilityStatus(onTimePercentage: number): {
  level: 'high' | 'medium' | 'low'
  label: string
  color: string
} {
  if (onTimePercentage >= 0.8) {
    return {
      level: 'high',
      label: 'High Reliability',
      color: 'text-green-600'
    }
  } else if (onTimePercentage >= 0.6) {
    return {
      level: 'medium',
      label: 'Medium Reliability',
      color: 'text-yellow-600'
    }
  } else {
    return {
      level: 'low',
      label: 'Low Reliability',
      color: 'text-red-600'
    }
  }
}

/**
 * Get risk level styling
 */
export function getRiskStyling(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): {
  bgColor: string
  textColor: string
  label: string
} {
  switch (riskLevel) {
    case 'LOW':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        label: 'Low Risk'
      }
    case 'MEDIUM':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        label: 'Medium Risk'
      }
    case 'HIGH':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        label: 'High Risk'
      }
  }
}

/**
 * Get confidence level styling
 */
export function getConfidenceStyling(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): {
  color: string
  label: string
} {
  switch (confidence) {
    case 'HIGH':
      return {
        color: 'text-green-600',
        label: 'High Confidence'
      }
    case 'MEDIUM':
      return {
        color: 'text-yellow-600',
        label: 'Medium Confidence'
      }
    case 'LOW':
      return {
        color: 'text-red-600',
        label: 'Low Confidence'
      }
  }
}

/**
 * Format time from ISO string to local time
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

/**
 * Format relative time (e.g., "in 5 minutes", "2 hours ago")
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  
  if (diffMinutes === 0) return 'now'
  if (diffMinutes === 1) return 'in 1 minute'
  if (diffMinutes > 1 && diffMinutes < 60) return `in ${diffMinutes} minutes`
  if (diffMinutes === -1) return '1 minute ago'
  if (diffMinutes < -1 && diffMinutes > -60) return `${Math.abs(diffMinutes)} minutes ago`
  
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours === 1) return 'in 1 hour'
  if (diffHours > 1) return `in ${diffHours} hours`
  if (diffHours === -1) return '1 hour ago'
  if (diffHours < -1) return `${Math.abs(diffHours)} hours ago`
  
  return formatTime(isoString)
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

import { useEffect, useState } from 'react'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showStaleWarning, setShowStaleWarning] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check if data might be stale (offline for more than 5 minutes)
    const checkStaleData = () => {
      if (isOffline) {
        const lastOnlineTime = localStorage.getItem('academia:last-online-time')
        if (lastOnlineTime) {
          const minutesOffline = (Date.now() - parseInt(lastOnlineTime)) / (1000 * 60)
          setShowStaleWarning(minutesOffline > 5)
        }
      }
    }

    const interval = setInterval(checkStaleData, 60000) // Check every minute
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOffline])

  // Update last online time when we come online
  useEffect(() => {
    if (!isOffline) {
      localStorage.setItem('academia:last-online-time', Date.now().toString())
      setShowStaleWarning(false)
    }
  }, [isOffline])

  if (!isOffline) return null

  return (
    <div className="fixed top-16 left-3 right-3 z-[90] flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 shadow-md md:left-auto md:right-4 md:max-w-sm dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <span>
          {showStaleWarning 
            ? 'Sin conexión - datos pueden estar desactualizados' 
            : 'Sin conexión - mostrando datos cacheados'}
        </span>
      </div>
    </div>
  )
}
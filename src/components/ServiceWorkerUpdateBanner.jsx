import { useUIStore } from '../stores/ui.store.js'
import { reloadServiceWorkerUpdate } from '../lib/serviceWorkerUpdate.js'

export default function ServiceWorkerUpdateBanner() {
  const { serviceWorkerUpdate } = useUIStore()

  if (!serviceWorkerUpdate.fallbackVisible) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[90] flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 shadow-md md:bottom-4 md:left-auto md:right-4 md:max-w-sm dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <span>Hay una version nueva disponible.</span>
      <button
        type="button"
        onClick={reloadServiceWorkerUpdate}
        className="shrink-0 rounded-md bg-amber-700 px-3 py-1.5 font-medium text-white hover:bg-amber-800"
      >
        Actualizar
      </button>
    </div>
  )
}
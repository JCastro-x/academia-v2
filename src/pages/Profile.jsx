import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useProfile, useUpsertProfile } from '../features/profile/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { savePushSubscription, urlBase64ToUint8Array } from '../lib/supabase.js'

const THEME_COLORS = [
  { name: 'Verde lima', value: '#84cc16' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Púrpura', value: '#a855f7' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Rosa pastel', value: '#EBCBD5' },
  { name: 'Azul pastel', value: '#B3CEE8' },
  { name: 'Verde menta', value: '#B9D7C8' },
  { name: 'Lavanda suave', value: '#DFE0F0' },
]

const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'System UI', value: 'System UI' },
]

export default function Profile() {
  const { data: profile, isLoading } = useProfile()
  const upsertProfile = useUpsertProfile()
  const hasAttemptedCreate = useRef(false)

  const {
    modoOscuro, tipografia, temaColor, sonidosInteraccion, horaFormato,
    setModoOscuro, setTipografia, setTemaColor, setSonidosInteraccion, setHoraFormato,
  } = useUIStore()

  // Form state for editable data fields (no asociado a preview)
  const [formData, setFormData] = useState({
    nombre: '',
    registro_academico: '',
    carrera: '',
    institucion: '',
  })
  const [formInitialized, setFormInitialized] = useState(false)
  const [pushStatus, setPushStatus] = useState('checking')
  const [pushError, setPushError] = useState('')
  const [pushPending, setPushPending] = useState(false)

  // Hydrate formData from profile once loaded
  useEffect(() => {
    if (profile && !formInitialized) {
      const nextNombre = profile.nombre || ''
      setFormData({
        nombre: nextNombre,
        registro_academico: profile.registro_academico || '',
        carrera: profile.carrera || '',
        institucion: profile.institucion || '',
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem('academia-profile-name', nextNombre)
      }
      setFormInitialized(true)
    }
  }, [profile, formInitialized])

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      return
    }

    setPushStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default')
  }, [])

  // Guard defensivo: no crear un perfil vacío si ya hubo un nombre persistido o si no hay sesión válida.
  useEffect(() => {
    if (profile !== null || hasAttemptedCreate.current || upsertProfile.isPending) {
      return
    }

    const cachedSessionUser = localStorage.getItem('academia-session-user')
    const cachedProfileName = localStorage.getItem('academia-profile-name') || ''

    if (!cachedSessionUser) {
      return
    }

    if (cachedProfileName.trim().length > 0) {
      hasAttemptedCreate.current = true
      return
    }

    hasAttemptedCreate.current = true
    upsertProfile.mutate({
      nombre: '',
      registro_academico: '',
      carrera: '',
      institucion: '',
      modo_oscuro: false,
      tipografia: 'Inter',
      tema_color: '#84cc16',
      sonidos_interaccion: 'classic',
      hora_formato: '12h',
    })
  }, [profile, upsertProfile])

  const handleFieldChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    const payload = {
      ...formData,
      modo_oscuro: modoOscuro,
      tipografia,
      tema_color: temaColor,
      sonidos_interaccion: sonidosInteraccion,
      hora_formato: horaFormato,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('academia-profile-name', payload.nombre || '')
    }
    console.log('[Profile] Guardando perfil:', JSON.stringify(payload, null, 2))
    try {
      await upsertProfile.mutateAsync(payload)
    } catch (error) {
      console.error('[Profile] Error saving profile:', error)
    }
  }

  const handleEnablePushNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      setPushError('Este navegador no soporta notificaciones push.')
      return
    }

    try {
      setPushPending(true)
      setPushError('')

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('denied')
        setPushError('Las notificaciones fueron rechazadas. Podés activarlas desde la configuración del navegador.')
        return
      }

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error('Falta VITE_VAPID_PUBLIC_KEY en el entorno.')
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await savePushSubscription(subscription)
      setPushStatus('granted')
    } catch (error) {
      console.error('[Profile] Error enabling push notifications:', error)
      setPushStatus('error')
      setPushError(error.message || 'No se pudo activar el recordatorio push.')
    } finally {
      setPushPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-[var(--dm-text-muted)]">
        Cargando...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto pb-16"
    >
      <h1 className="text-2xl font-bold mb-6 dark:text-[var(--dm-text)]">Mi Perfil</h1>

      {/* Datos personales */}
      <section className="bg-white dark:bg-[var(--dm-surface)] rounded-lg border dark:border-[var(--dm-border)] p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-[var(--dm-text)]">Datos personales</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={handleFieldChange('nombre')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-1">
              Registro académico
            </label>
            <input
              type="text"
              value={formData.registro_academico}
              onChange={handleFieldChange('registro_academico')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-1">
              Carrera
            </label>
            <input
              type="text"
              value={formData.carrera}
              onChange={handleFieldChange('carrera')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-1">
              Institución
            </label>
            <input
              type="text"
              value={formData.institucion}
              onChange={handleFieldChange('institucion')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-1">
              Cursos ganados
            </label>
            <input
              type="number"
              value={profile?.cursos_ganados ?? 0}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-[var(--dm-border)] rounded-lg bg-gray-50 dark:bg-[var(--dm-bg)] text-gray-500 dark:text-[var(--dm-text-muted)] cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)] mt-1">
              Este valor se actualiza automáticamente al aprobar cursos.
            </p>
          </div>
        </div>
      </section>

      {/* Personalización */}
      <section className="bg-white dark:bg-[var(--dm-surface)] rounded-lg border dark:border-[var(--dm-border)] p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-[var(--dm-text)]">Personalización</h2>
        <div className="space-y-6">
          {/* Tipografía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-2">
              Tipografía
            </label>
            <div className="flex gap-2 flex-wrap">
              {FONT_OPTIONS.map(font => (
                <button
                  key={font.value}
                  onClick={() => setTipografia(font.value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    tipografia === font.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-20 text-black dark:text-black'
                      : 'border-gray-300 text-black dark:border-[var(--dm-border)] dark:text-white hover:border-gray-400 dark:hover:border-white'
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color de tema */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-2">
              Color de tema
            </label>
            <div className="flex flex-wrap gap-3">
              {THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setTemaColor(color.value)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    temaColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[var(--dm-surface)] scale-110' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-2">
              Formato de hora
            </label>
            <div className="flex gap-2 flex-wrap">
              {['12h', '24h'].map(option => (
                <button
                  key={option}
                  onClick={() => setHoraFormato(option)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    horaFormato === option
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-20 text-black dark:text-black'
                      : 'border-gray-300 text-black dark:border-[var(--dm-border)] dark:text-white hover:border-gray-400 dark:hover:border-white'
                  }`}
                >
                  {option === '12h' ? '12 horas' : '24 horas'}
                </button>
              ))}
            </div>
          </div>

          {/* Sonidos */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)]">
                Sonidos de interacción
              </label>
              <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)] mt-0.5">
                {sonidosInteraccion === 'off' ? 'Desactivados' : 'Activados'}
              </p>
            </div>
            <button
              onClick={() => setSonidosInteraccion(sonidosInteraccion === 'off' ? 'classic' : 'off')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                sonidosInteraccion !== 'off' ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-[var(--dm-border)]'
              }`}
              role="switch"
              aria-checked={sonidosInteraccion !== 'off'}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                sonidosInteraccion !== 'off' ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>

          {/* Modo oscuro */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)]">
                Modo oscuro
              </label>
              <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)] mt-0.5">
                {modoOscuro ? 'Oscuro' : 'Claro'}
              </p>
            </div>
            <button
              onClick={() => setModoOscuro(!modoOscuro)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                modoOscuro ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-[var(--dm-border)]'
              }`}
              role="switch"
              aria-checked={modoOscuro}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                modoOscuro ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[var(--dm-surface)] rounded-lg border dark:border-[var(--dm-border)] p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold dark:text-[var(--dm-text)]">Recordatorios</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
              Activá notificaciones para recibir avisos de entregas y resúmenes diarios aunque la app esté cerrada.
            </p>
          </div>
          <button
            onClick={handleEnablePushNotifications}
            disabled={pushPending || pushStatus === 'granted'}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pushPending ? 'Activando...' : pushStatus === 'granted' ? 'Recordatorios activos' : 'Activar recordatorios'}
          </button>
        </div>

        {pushStatus === 'unsupported' && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Tu navegador no soporta notificaciones push.
          </p>
        )}

        {pushStatus === 'denied' && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">
            Las notificaciones fueron rechazadas. Podés habilitarlas desde la configuración del navegador y volver a intentarlo.
          </p>
        )}

        {pushError && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">{pushError}</p>
        )}
      </section>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={upsertProfile.isPending}
        className="w-full bg-[var(--color-primary)] text-black py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        style={{ color: '#000000' }}
      >
        {upsertProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </motion.div>
  )
}
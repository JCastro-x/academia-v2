import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useProfile, useUpsertProfile } from '../features/profile/hooks.js'
import { useUIStore } from '../stores/ui.store.js'

const THEME_COLORS = [
  { name: 'Verde lima', value: '#84cc16' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Púrpura', value: '#a855f7' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Rojo', value: '#ef4444' },
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
    modoOscuro, tipografia, temaColor, sonidosInteraccion,
    setModoOscuro, setTipografia, setTemaColor, setSonidosInteraccion,
  } = useUIStore()

  // Form state for editable data fields (no asociado a preview)
  const [formData, setFormData] = useState({
    nombre: '',
    registro_academico: '',
    carrera: '',
    institucion: '',
  })
  const [formInitialized, setFormInitialized] = useState(false)

  // Hydrate formData from profile once loaded
  useEffect(() => {
    if (profile && !formInitialized) {
      setFormData({
        nombre: profile.nombre || '',
        registro_academico: profile.registro_academico || '',
        carrera: profile.carrera || '',
        institucion: profile.institucion || '',
      })
      setFormInitialized(true)
    }
  }, [profile, formInitialized])

  // Creación automática una vez por sesión si no existe perfil (Opción B)
  useEffect(() => {
    if (profile === null && !hasAttemptedCreate.current && !upsertProfile.isPending) {
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
      })
    }
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

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
    }
    console.log('[Profile] Guardando perfil:', JSON.stringify(payload, null, 2))
    try {
      await upsertProfile.mutateAsync(payload)
    } catch (error) {
      console.error('[Profile] Error saving profile:', error)
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
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)]'
                      : 'border-gray-300 dark:border-[var(--dm-border)] dark:text-[var(--dm-text-muted)] hover:border-gray-400 dark:hover:border-[var(--dm-text-muted)]'
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
            <div className="flex gap-3">
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

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={upsertProfile.isPending}
        className="w-full bg-[var(--color-primary)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {upsertProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </motion.div>
  )
}
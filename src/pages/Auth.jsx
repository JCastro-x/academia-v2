import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInLocalDev, signInWithGoogle } from '../lib/supabase.js'
import { useUIStore } from '../stores/ui.store.js'
import FirstRunTour from '../components/FirstRunTour.jsx'

const SESSION_DEBUG_STORAGE_KEY = 'academia-debug-session'

function isSessionDebugEnabled() {
  if (typeof window === 'undefined') return false

  try {
    const searchParams = new URLSearchParams(window.location.search)
    const queryDebug = searchParams.get('debug') === 'session'

    if (queryDebug) {
      localStorage.setItem(SESSION_DEBUG_STORAGE_KEY, '1')
    }

    return queryDebug || localStorage.getItem(SESSION_DEBUG_STORAGE_KEY) === '1'
  } catch (error) {
    console.warn('[DEBUG session] Failed to read debug flag', error)
    return false
  }
}

const rotatingWords = ['tu semana', 'tu semestre', 'tu estudio', 'tu futuro']

const featureCards = [
  { title: 'Materias', text: 'Organizá horarios, temas y entregas en una sola vista.', accent: 'from-violet-500/20 to-indigo-500/5' },
  { title: 'Tareas', text: 'Priorizá cada entrega y mantené el calendario bajo control.', accent: 'from-sky-500/20 to-cyan-500/5' },
  { title: 'Notas', text: 'Guardá ideas, resúmenes y ejemplos de estudio sin perder contexto.', accent: 'from-fuchsia-500/20 to-pink-500/5' },
  { title: 'Pomodoro', text: 'Trabajá focado con bloques de estudio y pausas inteligentes.', accent: 'from-emerald-500/20 to-lime-500/5' },
]

const overviewItems = [
  { title: 'Sync multi-dispositivo', text: 'Tu información se actualiza en tiempo real entre dispositivos, sin perder el contexto de tus materias y tareas.' },
  { title: 'Pomodoro anti-throttle', text: 'Mantén tus bloques de estudio precisos aunque cambies de pestaña o el navegador baje el foco.' },
  { title: 'Calificaciones por zona', text: 'Seguimiento de parciales, tareas, finales y promedio ponderado con metas claras para aprobar.' },
  { title: 'Notas con OCR', text: 'Subí imágenes y PDFs para extraer texto, resumir y organizar mejor tus apuntes.' },
  { title: 'Asistente académico', text: 'Utilizá ayuda contextual para definir tareas, resumir contenido y ordenar el estudio.' },
  { title: 'PWA instalable', text: 'Accedé como app nativa en celular, escritorio o tablet con mejor experiencia de uso.' },
]

export default function Auth() {
  const [typedWord, setTypedWord] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const navigate = useNavigate()
  const resetTheme = useUIStore(s => s.resetTheme)
  const sessionDebugEnabled = isSessionDebugEnabled()
  const localHostnames = ['localhost', '127.0.0.1', '[::1]']
  const hasLocalDevCredentials =
    import.meta.env.DEV &&
    localHostnames.includes(window.location.hostname) &&
    Boolean(import.meta.env.VITE_DEV_EMAIL) &&
    Boolean(import.meta.env.VITE_DEV_PASSWORD)

  useEffect(() => {
    resetTheme()
  }, [resetTheme])

  useEffect(() => {
    const interval = setInterval(() => {
      setTypedWord((current) => (current + 1) % rotatingWords.length)
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setIsTyping(false), 900)
    return () => clearTimeout(timeout)
  }, [typedWord])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const handleLocalDevSignIn = async () => {
    try {
      await signInLocalDev()
      navigate('/create-first-semester')
    } catch (error) {
      console.error('Error signing in with local dev account:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {sessionDebugEnabled && (
        <div className="fixed right-3 top-3 z-[100] rounded-full border border-amber-300/60 bg-amber-100/90 px-2 py-1 text-[10px] font-medium text-amber-900 shadow-sm backdrop-blur-sm">
          DEBUG: {typeof window !== 'undefined' && localStorage.getItem('sb-') ? 'storage: yes' : 'storage: no'} · PWA: {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 animate-[pulse_12s_ease-in-out_infinite] rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute right-6 top-10 h-80 w-80 animate-[pulse_16s_ease-in-out_infinite] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-[pulse_18s_ease-in-out_infinite] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_30%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_30px_rgba(168,85,247,0.12)] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-lg font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.45)]">
              A
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-violet-200">Academia</p>
              <p className="text-sm font-medium text-slate-200">v2</p>
            </div>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section className="pt-10 lg:pt-14">
            <div className="mb-5 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-violet-100 shadow-[0_0_18px_rgba(168,85,247,0.2)]">
              Organiza tu vida académica
            </div>

            <h1 className="mb-5 max-w-xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Tu semestre,
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(168,85,247,0.55)]">
                {isTyping ? '...' : rotatingWords[typedWord]}
              </span>
            </h1>

            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Centralizá tus materias, tareas, notas y rutinas en una sola experiencia clara, enfocada y relajante para estudiar mejor.
            </p>

            <label className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-violet-500 focus:ring-violet-400"
              />
              <span>
                Acepto los <Link to="/terms" className="font-medium text-violet-200 underline underline-offset-2">Términos</Link> y la <Link to="/privacy" className="font-medium text-violet-200 underline underline-offset-2">Política de privacidad</Link>.
              </span>
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleGoogleSignIn}
                disabled={!acceptedTerms}
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-5 py-3 font-semibold text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(168,85,247,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Ingresar con Google
              </button>

              {hasLocalDevCredentials && (
                <button
                  onClick={handleLocalDevSignIn}
                  className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-5 py-3 font-semibold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20"
                >
                  Entrar como dev (local)
                </button>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">✓ Sincronización real</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">✓ Seguimiento de notas</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">✓ Estudio con foco</span>
            </div>
          </section>

          <aside className="rounded-[28px] border border-violet-500/20 bg-slate-950/70 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.7),0_0_28px_rgba(168,85,247,0.18)] backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resumen</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Tu semana</h2>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">
                  +12% foco
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Próxima entrega</p>
                  <p className="mt-2 text-lg font-semibold text-white">Análisis de texto</p>
                  <p className="mt-1 text-sm text-slate-300">Mañana · 8:00 hs</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tareas</p>
                    <p className="mt-2 text-3xl font-bold text-white">07</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Notas</p>
                    <p className="mt-2 text-3xl font-bold text-white">18</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>

        <section className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.accent} p-[1px] shadow-[0_0_24px_rgba(168,85,247,0.08)]`}
            >
              <div className="h-full rounded-[calc(1.5rem-1px)] bg-slate-950/80 p-5">
                <div className="mb-3 h-10 w-10 rounded-xl bg-white/5 ring-1 ring-white/10 shadow-[0_0_18px_rgba(56,189,248,0.15)]" />
                <h3 className="text-xl font-bold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{card.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_35px_rgba(168,85,247,0.12)] md:p-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Funciones</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Todo lo que necesitás para el semestre.</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {overviewItems.map(({ title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_18px_rgba(56,189,248,0.05)]">
                <div className="mb-3 inline-flex rounded-xl bg-violet-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200 shadow-[0_0_18px_rgba(168,85,247,0.12)]">
                  {title}
                </div>
                <p className="text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="relative border-t border-white/10 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p>© 2025 Academia v2</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white">Términos</Link>
            <Link to="/privacy" className="hover:text-white">Privacidad</Link>
          </div>
        </div>
      </footer>

      <FirstRunTour />
    </div>
  )
}

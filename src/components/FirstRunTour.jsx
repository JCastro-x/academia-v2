import { useEffect, useState } from 'react'

const STORAGE_KEY = 'academia-first-run-tour-done'

const steps = [
  {
    title: 'Un lugar para ordenar todo',
    text: 'Centralizá tus materias, tareas y calificaciones para que tu semana se vea clara desde el primer vistazo.',
  },
  {
    title: 'Tareas con ritmo real',
    text: 'Seguí los plazos, priorizá lo importante y no te pierdas en la pileta de pendientes.',
  },
  {
    title: 'Estudio con foco',
    text: 'Usá el reloj y el Pomodoro para reservar bloques de trabajo sin distraerte con el resto.',
  },
]

export default function FirstRunTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })

  useEffect(() => {
    if (visible) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [visible])

  if (!visible) return null

  const current = steps[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-violet-500/30 bg-slate-950/90 p-6 shadow-[0_30px_100px_rgba(76,29,149,0.55)] ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full border border-violet-400/40 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
            Primera vez aquí
          </span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Saltear
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index <= step ? 'bg-violet-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <h3 className="mb-3 text-2xl font-semibold text-white">{current.title}</h3>
        <p className="mb-6 text-sm leading-6 text-slate-300">{current.text}</p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Después
          </button>

          <button
            type="button"
            onClick={() => {
              if (step < steps.length - 1) {
                setStep((prev) => prev + 1)
                return
              }
              setVisible(false)
            }}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110"
          >
            {step < steps.length - 1 ? 'Siguiente' : 'Empezar'}
          </button>
        </div>
      </div>
    </div>
  )
}

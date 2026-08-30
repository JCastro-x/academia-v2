import { useNavigate } from 'react-router-dom'

export default function LocalDemo() {
  const navigate = useNavigate()

  const exitDemo = () => {
    localStorage.removeItem('academia-demo-mode')
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-lg font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.45)]">
              A
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-violet-200">Academia</p>
              <p className="text-sm font-medium text-slate-200">v2 · demo local</p>
            </div>
          </div>

          <button
            onClick={exitDemo}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.6)] md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Modo local</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Vista de prueba sin sesión</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Aquí puedes revisar cambios visuales de la app en localhost sin depender de Supabase ni de una sesión real.
            Los datos remotos no cargan en esta vista, pero el layout y el styling sí se pueden iterar con rapidez.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-violet-200">Layout</p>
            <p className="mt-2 text-sm text-slate-300">Versión local para validar UI, espaciados y mobile.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-violet-200">Activación</p>
            <p className="mt-2 text-sm text-slate-300">Se entra con un botón desde la pantalla de autenticación.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-violet-200">Estado</p>
            <p className="mt-2 text-sm text-slate-300">Todo queda local y no persiste en Supabase.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

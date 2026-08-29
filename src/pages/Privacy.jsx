export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(76,29,149,0.35)] md:p-8">
        <a href="/auth" className="mb-6 inline-flex text-sm text-violet-200 transition hover:text-white">← Volver</a>
        <h1 className="mb-6 text-3xl font-bold">Política de privacidad</h1>

        <p className="mb-4 text-slate-300">Última actualización: Agosto 2026</p>

        <section className="space-y-5 text-sm leading-7 text-slate-300">
          <p>Academia v2 respeta la privacidad de sus usuarios y trata la información personal y académica con la debida confidencialidad. Esta política describe qué datos se recopilan, cómo se usan, con quién se comparten y qué derechos tienen los usuarios sobre su información.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">1. Información que recopilamos</h2>
          <p>Podemos recopilar información proporcionada directamente por el usuario, como nombre, correo electrónico, materia, tareas, notas, horarios, calificaciones, preferencias de visualización y otros datos académicos que ingrese en la aplicación.</p>
          <p>Cuando el usuario inicia sesión con Google, también se puede acceder a información básica de autenticación y perfil, necesaria para identificar la cuenta y mantener la sesión de manera segura.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">2. Finalidad del tratamiento</h2>
          <p>La información se utiliza para permitir el funcionamiento de la Plataforma, gestionar la sesión, personalizar la experiencia, guardar datos académicos, mantener la sincronización y mejorar la funcionalidad del servicio.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">3. Almacenamiento y seguridad</h2>
          <p>Los datos se almacenan en infraestructura segura y se toman medidas razonables para proteger la información contra accesos no autorizados, uso indebido, pérdida o alteración. Sin embargo, ninguna transmisión ni almacenamiento digital puede considerarse completamente invulnerable.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">4. Compartición de información</h2>
          <p>No vendemos ni alquilamos datos personales para fines de marketing. La información puede compartirse solo con proveedores tecnológicos necesarios para operar la Plataforma, como servicios de autenticación, almacenamiento o infraestructura de base de datos, bajo obligaciones contractuales de confidencialidad.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">5. Derechos del usuario</h2>
          <p>El usuario puede solicitar acceso, corrección, eliminación o limitación del tratamiento de sus datos personales, en la medida en que la normativa aplicable lo permita. También puede revocar el consentimiento para ciertos tratamientos, salvo que exista una obligación legal que impida hacerlo.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">6. Cookies y tecnologías similares</h2>
          <p>La Plataforma puede utilizar cookies o tecnologías equivalentes para mantener la sesión, mejorar la experiencia y entender el uso general del servicio. El usuario puede gestionar la configuración de cookies según el navegador que utilice.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">7. Datos de modo invitado</h2>
          <p>En modo invitado, los datos se guardan localmente en el dispositivo del usuario y no se sincronizan necesariamente entre equipos. El usuario debe entender que la información puede perderse si borra el almacenamiento local o cambia de navegador o dispositivo.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">8. Cambios en la política</h2>
          <p>Esta política puede actualizarse periódicamente para reflejar cambios legales, funcionales o operativos. El uso continuo de la Plataforma después de la actualización implica la aceptación de la nueva versión.</p>

          <h2 className="mt-6 text-lg font-semibold text-white">9. Contacto</h2>
          <p>Para consultas relacionadas con privacidad, tratamiento de datos o derechos de los usuarios, puede contactarse a través de los canales oficiales del servicio o del responsable de la aplicación designado.</p>
        </section>
      </div>
    </div>
  )
}

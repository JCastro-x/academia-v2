import { test, expect } from '@playwright/test'

test.describe('Habits tracker e2e - Oct 9, 2026 (Friday)', () => {
  async function setupGuestAndHabits(page) {
    await page.goto('http://localhost:5174')
    await page.evaluate(() => localStorage.clear())
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Cerrar modal de onboarding con botón "Saltear"
    const skipButton = page.getByRole('button', { name: 'Saltear' })
    if (await skipButton.isVisible()) {
      await skipButton.click()
      await page.waitForTimeout(500)
    }

    // Aceptar términos
    const termsCheckbox = page.getByRole('checkbox')
    await termsCheckbox.check()
    await page.waitForTimeout(500)

    // Fijar fecha: viernes 9 de octubre de 2026, 10:00 hora local
    await page.clock.setFixedTime(new Date(2026, 9, 9, 10, 0, 0))

    // Hacer clic en "Modo invitado"
    const guestButton = page.getByRole('button', { name: 'Modo invitado' })
    await expect(guestButton).toBeEnabled()
    await guestButton.click()
    
    // Esperar navegación
    await page.waitForURL('**/create-first-semester', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Crear semestre guest
    const nameInput = page.getByLabel('Nombre del semestre')
    await nameInput.fill('Guest Semester 2026')
    
    const startDateInput = page.getByLabel('Fecha de inicio')
    await startDateInput.fill('2026-08-01')
    
    const endDateInput = page.getByLabel('Fecha de fin')
    await endDateInput.fill('2026-12-31')

    const createButton = page.getByRole('button', { name: 'Crear semestre' })
    await createButton.click()
    
    // Esperar navegación a la vista del semestre
    await page.waitForURL('**/s/**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const semesterUrl = page.url()

    // Sembrar hábitos manualmente en localStorage
    await page.evaluate(() => {
      const habits = [
        { id: crypto.randomUUID(), nombre: 'Despertar a las 7', momento_dia: 'manana', archivado: false },
        { id: crypto.randomUUID(), nombre: 'Journaling corto', momento_dia: 'manana', archivado: false },
      ]
      const programaciones = [
        { id: crypto.randomUUID(), habit_id: habits[0].id, tipo: 'dias_fijos', dias_semana: [1, 2, 3, 4, 5], permitir_finde_plus: false, tolerar_rojo_aislado: false, vigente_desde: '2026-10-05' },
        { id: crypto.randomUUID(), habit_id: habits[1].id, tipo: 'dias_fijos', dias_semana: [1, 2, 3, 4, 5, 6, 7], permitir_finde_plus: false, tolerar_rojo_aislado: false, vigente_desde: '2026-10-05' },
      ]
      localStorage.setItem('guest-habits-v2', JSON.stringify(habits))
      localStorage.setItem('guest-programaciones', JSON.stringify(programaciones))
      localStorage.setItem('guest-habit-logs', JSON.stringify([]))
      localStorage.setItem('guest-pause-days', JSON.stringify([]))
      localStorage.setItem('guest-app-config', JSON.stringify({ ventana_edicion_dias: 7 }))
      localStorage.setItem('guest-habits-schema-version', '4')
    })

    return semesterUrl
  }

  test('7 etiquetas de día y 7 celdas por fila', async ({ page }) => {
    const semesterUrl = await setupGuestAndHabits(page)
    const habitsPath = semesterUrl.replace(/\/$/, '') + '/habits'
    await page.goto(habitsPath)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Obtener etiquetas de día
    const dayLabels = page.locator('text=/Lun|Mar|Mié|Jue|Vie|Sáb|Dom/')
    await expect(dayLabels).toHaveCount(7)

    // Obtener celdas con aria-label de fechas
    const dateCells = page.locator('button[aria-label*="oct"]')
    const cellCount = await dateCells.count()
    expect(cellCount).toBeGreaterThanOrEqual(7)
  })

  test('clic en Lun 5 oct guarda 2026-10-05', async ({ page }) => {
    const semesterUrl = await setupGuestAndHabits(page)
    const habitsPath = semesterUrl.replace(/\/$/, '') + '/habits'
    await page.goto(habitsPath)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const mondayCell = page.getByLabel('Lun 05 oct').first()
    await expect(mondayCell).toBeVisible()

    await mondayCell.click()
    await page.waitForTimeout(500)

    const logs = await page.evaluate(() => {
      const data = localStorage.getItem('guest-habit-logs')
      return data ? JSON.parse(data) : []
    })

    expect(logs.length).toBeGreaterThan(0)
    expect(logs[logs.length - 1].fecha).toBe('2026-10-05')
    expect(logs[logs.length - 1].estado).toBe('cumplido')
  })

  test('ciclo vacío → cumplido → fallado → parcial → vacío', async ({ page }) => {
    const semesterUrl = await setupGuestAndHabits(page)
    const habitsPath = semesterUrl.replace(/\/$/, '') + '/habits'
    await page.goto(habitsPath)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const mondayCell = page.getByLabel('Lun 05 oct').first()

    // Primer clic: cumplido
    await mondayCell.click()
    await page.waitForTimeout(200)
    let logs = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    expect(logs[logs.length - 1].estado).toBe('cumplido')

    // Segundo clic: fallado
    await mondayCell.click()
    await page.waitForTimeout(200)
    logs = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    expect(logs[logs.length - 1].estado).toBe('fallado')

    // Tercer clic: parcial
    await mondayCell.click()
    await page.waitForTimeout(200)
    logs = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    expect(logs[logs.length - 1].estado).toBe('parcial')

    // Cuarto clic: vacío (borra el log)
    await mondayCell.click()
    await page.waitForTimeout(200)
    logs = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    const matchingLogs = logs.filter(l => l.fecha === '2026-10-05')
    expect(matchingLogs.length).toBe(0)
  })

  test('futuro (sáb 10) no cambia', async ({ page }) => {
    const semesterUrl = await setupGuestAndHabits(page)
    const habitsPath = semesterUrl.replace(/\/$/, '') + '/habits'
    await page.goto(habitsPath)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const saturdayCell = page.getByLabel('Sáb 10 oct').first()
    
    // Verificar que está deshabilitado
    await expect(saturdayCell).toBeDisabled()
    
    const logsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    
    // Intentar hacer clic (no debería hacer nada porque está deshabilitado)
    await saturdayCell.click({ force: true })
    await page.waitForTimeout(200)
    
    const logsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    expect(logsAfter.length).toBe(logsBefore.length)
  })

  test('weekend en hábito L-V no cambia', async ({ page }) => {
    const semesterUrl = await setupGuestAndHabits(page)
    const habitsPath = semesterUrl.replace(/\/$/, '') + '/habits'
    await page.goto(habitsPath)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // "Despertar a las 7" es L-V, sábado no debería cambiar
    const saturdayCell = page.getByLabel('Sáb 10 oct').first()
    
    // Verificar que está deshabilitado
    await expect(saturdayCell).toBeDisabled()
    
    const logsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    
    // Intentar hacer clic (no debería hacer nada porque está deshabilitado)
    await saturdayCell.click({ force: true })
    await page.waitForTimeout(200)
    
    const logsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    expect(logsAfter.length).toBe(logsBefore.length)
  })

  test('estado persiste tras reload', async ({ page }) => {
    const semesterUrl = await setupGuestAndHabits(page)
    const habitsPath = semesterUrl.replace(/\/$/, '') + '/habits'
    await page.goto(habitsPath)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const mondayCell = page.getByLabel('Lun 05 oct').first()
    await mondayCell.click()
    await page.waitForTimeout(200)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem('guest-habit-logs') || '[]'))
    const mondayLog = logs.find(l => l.fecha === '2026-10-05')
    expect(mondayLog).toBeDefined()
    expect(mondayLog.estado).toBe('cumplido')
  })
})

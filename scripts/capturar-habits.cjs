const { chromium } = require('playwright')

async function capturarHabits() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Navegar a la app
  await page.goto('http://localhost:5174')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Cerrar modal de onboarding con Escape
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Navegar a Hábitos usando el menú de navegación
  const habitsLink = page.locator('a[href*="habits"]').first()
  if (await habitsLink.isVisible()) {
    await habitsLink.click()
  } else {
    // Si no encuentra el link, ir directamente
    await page.goto('http://localhost:5174/s/guest-1790103665427/habits')
  }

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Cargar datos de ejemplo
  const exampleDataButton = page.getByText('⚠️ Cargar datos de ejemplo')
  if (await exampleDataButton.isVisible()) {
    await exampleDataButton.click()
    await page.waitForTimeout(1000)
  }

  // === CAPTURAS SEMANA ===

  // Captura Semana - 1400px (dark)
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.screenshot({ path: 'docs/capturas/semana-1400px-dark.png', fullPage: true })

  // Captura Semana - 375px (dark)
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: 'docs/capturas/semana-375px-dark.png', fullPage: true })

  // === CAPTURAS PROGRESO ===

  // Cambiar a Progreso - buscar por varios selectores
  const progresoButton = page.locator('button:has-text("Progreso")').first()
  const progresoTab = page.locator('[role="tab"]:has-text("Progreso")').first()
  
  if (await progresoButton.isVisible()) {
    await progresoButton.click()
  } else if (await progresoTab.isVisible()) {
    await progresoTab.click()
  }
  
  await page.waitForTimeout(2000)

  // Captura Progreso - 1400px (dark)
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.screenshot({ path: 'docs/capturas/progreso-1400px-dark.png', fullPage: true })

  // Captura Progreso - 375px (dark) - scroll al final
  await page.setViewportSize({ width: 375, height: 667 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'docs/capturas/progreso-375px-dark.png', fullPage: true })

  // === CAPTURAS TEMA CLARO ===

  // Cambiar a tema claro
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
  })
  await page.waitForTimeout(500)

  // Volver a Semana
  const semanaButton = page.locator('button:has-text("Semana")').first()
  if (await semanaButton.isVisible()) {
    await semanaButton.click()
  }
  await page.waitForTimeout(1000)

  // Capturas Semana tema claro
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.screenshot({ path: 'docs/capturas/semana-1400px-light.png', fullPage: true })

  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: 'docs/capturas/semana-375px-light.png', fullPage: true })

  // Cambiar a Progreso
  if (await progresoButton.isVisible()) {
    await progresoButton.click()
  } else if (await progresoTab.isVisible()) {
    await progresoTab.click()
  }
  await page.waitForTimeout(1000)

  // Capturas Progreso tema claro
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.screenshot({ path: 'docs/capturas/progreso-1400px-light.png', fullPage: true })

  await page.setViewportSize({ width: 375, height: 667 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'docs/capturas/progreso-375px-light.png', fullPage: true })

  await browser.close()
  console.log('Capturas generadas en docs/capturas/')
}

capturarHabits().catch(console.error)

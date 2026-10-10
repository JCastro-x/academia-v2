const { chromium } = require('playwright')

async function capturarHabits() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Navegar a Hábitos
  await page.goto('http://localhost:5174/s/guest-1790103665427/habits')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Captura Semana - 1400px (dark)
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.screenshot({ path: 'docs/capturas/semana-1400px-dark.png', fullPage: true })

  // Captura Semana - 375px (dark)
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: 'docs/capturas/semana-375px-dark.png', fullPage: true })

  // Cambiar a tema claro
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
  })
  await page.waitForTimeout(500)

  // Capturas tema claro
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.screenshot({ path: 'docs/capturas/semana-1400px-light.png', fullPage: true })

  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: 'docs/capturas/semana-375px-light.png', fullPage: true })

  await browser.close()
  console.log('Capturas generadas en docs/capturas/')
}

capturarHabits().catch(console.error)

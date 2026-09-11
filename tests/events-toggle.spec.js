import { test, expect } from '@playwright/test';

test('events toggle functionality', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Find the events toggle checkbox
  const eventsToggle = page.locator('input[type="checkbox"]').filter({ hasText: '' }).first();
  
  // Check initial state - toggle should be unchecked
  await expect(eventsToggle).not.toBeChecked();
  
  // Find the events section (should not be visible initially)
  const eventsSection = page.locator('div').filter({ hasText: 'Evento' }).first();
  await expect(eventsSection).not.toBeVisible();
  
  // Activate the toggle
  await eventsToggle.check();
  
  // Wait for events to appear
  await page.waitForTimeout(500);
  
  // Now events should be visible
  const eventsAfterToggle = page.locator('div').filter({ hasText: 'Evento' });
  const eventCount = await eventsAfterToggle.count();
  
  if (eventCount > 0) {
    // Check that events have color classes
    const firstEvent = eventsAfterToggle.first();
    await expect(firstEvent).toBeVisible();
    
    // Check for color classes (parcial=red, tarea=green, otro=blue, proyecto=orange)
    const eventColors = ['bg-red-100', 'bg-green-100', 'bg-blue-100', 'bg-orange-100'];
    const hasColorClass = await firstEvent.evaluate(el => {
      return eventColors.some(color => el.classList.contains(color));
    });
    await expect(hasColorClass).toBeTruthy();
  }
  
  // Deactivate the toggle
  await eventsToggle.uncheck();
  
  // Wait for events to disappear
  await page.waitForTimeout(500);
  
  // Events should not be visible anymore
  await expect(eventsAfterToggle).not.toBeVisible();
  
  // Tasks should still be visible
  const tasksSection = page.locator('.task-card');
  const taskCount = await tasksSection.count();
  if (taskCount > 0) {
    await expect(tasksSection.first()).toBeVisible();
  }
});
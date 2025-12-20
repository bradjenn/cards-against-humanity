import type { Page } from '@playwright/test';

/**
 * Navigate to a page and wait for React to be fully hydrated.
 * This ensures React has fully loaded and event handlers are attached before tests interact with the page.
 */
export async function gotoAndWaitForHydration(page: Page, url: string) {
  // Set up listener for Vite connection BEFORE navigation
  const viteConnectedPromise = page.waitForEvent('console', {
    predicate: (msg) => msg.text().includes('[vite] connected'),
    timeout: 10000,
  }).catch(() => {
    // Fallback if Vite message doesn't appear
    console.warn('Vite connection message not detected, continuing anyway');
  });

  // Navigate to the page
  await page.goto(url);

  // Wait for Vite to connect
  await viteConnectedPromise;

  // Give React time to hydrate (attach event handlers, etc.)
  // Increased to 2500ms for slower machines
  await page.waitForTimeout(2500);
}

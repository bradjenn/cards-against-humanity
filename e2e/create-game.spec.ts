import { test, expect } from '@playwright/test';
import { gotoAndWaitForHydration } from './helpers';

test.describe('Create New Game', () => {
  test('should create a new game successfully', async ({ page }) => {
    // Go to home page and wait for React to hydrate
    await gotoAndWaitForHydration(page, '/');

    // Click "Start New Game" button
    await page.getByRole('link', { name: /start new game/i }).click();

    // Should be on new game page
    await expect(page).toHaveURL(/\/new-game/);
    await expect(page.getByRole('heading', { name: /create new game/i })).toBeVisible();

    // Enter player name
    await page.getByPlaceholder(/enter your name/i).fill('Test Player');

    // Select at least one pack
    await page.locator('.card').filter({ hasText: /white cards.*black cards/i }).first().click();

    // Verify pack is selected (should have black background)
    await expect(
      page.locator('.card.bg-black').filter({ hasText: /white cards.*black cards/i }).first()
    ).toBeVisible();

    // Click Create Game button
    await page.getByRole('button', { name: /create game/i }).click();

    // Should navigate to game lobby
    await expect(page).toHaveURL(/\/game\/.+/, { timeout: 10000 });

    // Should see game header with player name
    await expect(page.getByText(/test player/i)).toBeVisible();
  });

  test('should show error when no name is provided', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/new-game');

    // Select a pack
    await page.locator('.card').filter({ hasText: /white cards.*black cards/i }).first().click();

    // Verify pack is selected
    await expect(page.locator('.card.bg-black').first()).toBeVisible();

    // Try to create without entering name
    await page.getByRole('button', { name: /create game/i }).click();

    // Should show error
    await expect(page.getByText(/enter your name/i)).toBeVisible();
  });

  test('should show error when no packs are selected', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/new-game');

    // Enter name
    await page.getByPlaceholder(/enter your name/i).fill('Test Player');

    // Try to create without selecting packs
    await page.getByRole('button', { name: /create game/i }).click();

    // Should show error (in the error banner, not the help text)
    await expect(page.locator('.bg-red-100').getByText(/select at least one pack/i)).toBeVisible();
  });

  test('should allow selecting all packs at once', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/new-game');

    // Get initial pack count
    const allPacks = page.locator('.card').filter({ hasText: /white cards.*black cards/i });
    const totalCount = await allPacks.count();

    // Click "Select All" button
    await page.getByRole('button', { name: /select all/i }).click();

    // All packs should be selected - wait for all to have bg-black
    await expect(page.locator('.card.bg-black').filter({ hasText: /white cards.*black cards/i }))
      .toHaveCount(totalCount);

    // Button should change to "Deselect All"
    await expect(page.getByRole('button', { name: /deselect all/i })).toBeVisible();

    // Click "Deselect All"
    await page.getByRole('button', { name: /deselect all/i }).click();

    // All packs should be deselected - wait for all to have bg-white
    await expect(page.locator('.card.bg-white').filter({ hasText: /white cards.*black cards/i }))
      .toHaveCount(totalCount);
  });
});

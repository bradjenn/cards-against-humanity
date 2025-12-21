import { expect, test } from "@playwright/test";
import { gotoAndWaitForHydration } from "./helpers";

test.describe("Join Game", () => {
  test("should allow a second player to join an existing game", async ({
    browser,
  }) => {
    // Create two browser contexts (two players)
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates a game
      await gotoAndWaitForHydration(hostPage, "/new-game");
      await hostPage.getByPlaceholder(/enter your name/i).fill("Host Player");

      // Select first pack
      await hostPage
        .locator(".card")
        .filter({ hasText: /white cards.*black cards/i })
        .first()
        .click();

      // Create game
      await hostPage.getByRole("button", { name: /create game/i }).click();

      // Wait for lobby page
      await expect(hostPage).toHaveURL(/\/game\/.+/, { timeout: 10000 });

      // Get the game URL
      const gameUrl = hostPage.url();

      // Second player joins the game
      await playerPage.goto(gameUrl);

      // Should see join form
      await expect(
        playerPage.getByRole("heading", { name: /join this game/i }),
      ).toBeVisible();

      // Enter name and join
      await playerPage.getByPlaceholder(/your name/i).fill("Player 2");
      await playerPage.getByRole("button", { name: /join game/i }).click();

      // Player should see the lobby
      await expect(playerPage.getByText(/player 2/i)).toBeVisible();

      // Host should see both players in the lobby
      await expect(hostPage.getByText(/host player/i)).toBeVisible();
      await expect(hostPage.getByText(/player 2/i)).toBeVisible();

      // Host should see player count updated
      await expect(hostPage.getByText(/2 players/i)).toBeVisible();
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test("should prevent starting game with less than 3 players", async ({
    page,
  }) => {
    // Create a game
    await gotoAndWaitForHydration(page, "/new-game");
    await page.getByPlaceholder(/enter your name/i).fill("Host Player");
    await page
      .locator(".card")
      .filter({ hasText: /white cards.*black cards/i })
      .first()
      .click();
    await page.getByRole("button", { name: /create game/i }).click();

    // Wait for lobby
    await expect(page).toHaveURL(/\/game\/.+/);

    // Should see warning about needing more players
    await expect(page.getByText(/you need at least 3 players/i)).toBeVisible();

    // Start button should be disabled
    await expect(
      page.getByRole("button", { name: /start game/i }),
    ).toBeDisabled();
  });

  test("should copy invite link to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Create a game
    await gotoAndWaitForHydration(page, "/new-game");
    await page.getByPlaceholder(/enter your name/i).fill("Host Player");
    await page
      .locator(".card")
      .filter({ hasText: /white cards.*black cards/i })
      .first()
      .click();
    await page.getByRole("button", { name: /create game/i }).click();

    // Wait for lobby
    await expect(page).toHaveURL(/\/game\/.+/);

    // Click copy invite link
    await page.getByRole("button", { name: /copy invite link/i }).click();

    // Verify clipboard contains the game URL
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain("/game/");
  });

  test("should show error when joining with empty name", async ({
    browser,
  }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates a game
      await gotoAndWaitForHydration(hostPage, "/new-game");
      await hostPage.getByPlaceholder(/enter your name/i).fill("Host Player");
      await hostPage
        .locator(".card")
        .filter({ hasText: /white cards.*black cards/i })
        .first()
        .click();
      await hostPage.getByRole("button", { name: /create game/i }).click();
      await expect(hostPage).toHaveURL(/\/game\/.+/);

      const gameUrl = hostPage.url();

      // Player tries to join without a name
      await playerPage.goto(gameUrl);
      await playerPage.getByRole("button", { name: /join game/i }).click();

      // Should show error
      await expect(playerPage.getByText(/enter your name/i)).toBeVisible();
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});

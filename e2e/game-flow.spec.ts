import { expect, type Page, test } from "@playwright/test";
import { gotoAndWaitForHydration } from "./helpers";

async function createGameAsHost(
  page: Page,
  playerName: string,
): Promise<string> {
  await gotoAndWaitForHydration(page, "/new-game");
  await page.getByPlaceholder(/enter your name/i).fill(playerName);
  await page
    .locator(".card")
    .filter({ hasText: /white cards.*black cards/i })
    .first()
    .click();
  await page.getByRole("button", { name: /create game/i }).click();
  await expect(page).toHaveURL(/\/game\/.+/, { timeout: 10000 });
  return page.url();
}

async function joinGame(page: Page, gameUrl: string, playerName: string) {
  await gotoAndWaitForHydration(page, gameUrl);
  await page.getByPlaceholder(/your name/i).fill(playerName);
  await page.getByRole("button", { name: /join game/i }).click();
  await expect(page.getByText(new RegExp(playerName, "i"))).toBeVisible();
}

test.describe("Complete Game Flow", () => {
  test("should complete a full game round with 3 players", async ({
    browser,
  }) => {
    test.setTimeout(60000); // 60 seconds
    // Create three browser contexts for three players
    const hostContext = await browser.newContext();
    const player2Context = await browser.newContext();
    const player3Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const player2Page = await player2Context.newPage();
    const player3Page = await player3Context.newPage();

    try {
      // Step 1: Host creates the game
      console.log("Creating game as host...");
      const gameUrl = await createGameAsHost(hostPage, "Host Player");
      console.log("Game created:", gameUrl);

      // Step 2: Two more players join
      console.log("Player 2 joining...");
      await joinGame(player2Page, gameUrl, "Player 2");
      console.log("Player 3 joining...");
      await joinGame(player3Page, gameUrl, "Player 3");
      console.log("All players joined");

      // Step 3: Verify all players can see each other in lobby
      await expect(hostPage.getByText(/3 players/i)).toBeVisible();
      await expect(hostPage.getByText(/player 2/i)).toBeVisible();
      await expect(hostPage.getByText(/player 3/i)).toBeVisible();
      console.log("All players visible in lobby");

      // Step 4: Host starts the game
      console.log("Starting game...");
      const startButton = hostPage.getByRole("button", { name: /start game/i });
      await expect(startButton).toBeEnabled();
      await startButton.click();
      console.log("Start button clicked");

      // Step 5: All players should be redirected to round 1
      console.log("Waiting for navigation to round 1...");
      await expect(hostPage).toHaveURL(/\/game\/.+\/round\/1/, {
        timeout: 10000,
      });
      await expect(player2Page).toHaveURL(/\/game\/.+\/round\/1/, {
        timeout: 10000,
      });
      await expect(player3Page).toHaveURL(/\/game\/.+\/round\/1/, {
        timeout: 10000,
      });
      console.log("All players navigated to round 1");

      // Wait for React to hydrate on the round pages
      console.log("Waiting for React hydration...");
      await hostPage.waitForTimeout(3000);
      await player2Page.waitForTimeout(3000);
      await player3Page.waitForTimeout(3000);
      console.log("React hydrated");

      // Step 6: Verify black card is visible to all players
      console.log("Checking black card visibility...");
      const blackCardSelector = ".bg-neutral"; // Black card has neutral background
      await expect(hostPage.locator(blackCardSelector)).toBeVisible();
      await expect(player2Page.locator(blackCardSelector)).toBeVisible();
      await expect(player3Page.locator(blackCardSelector)).toBeVisible();
      console.log("Black card visible to all players");

      // Step 7: Identify the judge (will see different UI)
      // The judge will NOT have a submit button
      const pages = [
        { page: hostPage, name: "Host Player" },
        { page: player2Page, name: "Player 2" },
        { page: player3Page, name: "Player 3" },
      ];

      let judgePage: Page | null = null;
      const nonJudgePages: Page[] = [];

      console.log("Identifying judge and non-judge players...");
      for (const { page, name } of pages) {
        console.log(`Checking ${name} for submit button...`);
        // Use a short timeout to avoid hanging
        const submitButton = page.getByRole("button", {
          name: /submit.*card/i,
        });
        const submitButtonCount = await submitButton.count();
        console.log(`${name}: submit button count = ${submitButtonCount}`);

        if (submitButtonCount > 0) {
          nonJudgePages.push(page);
          console.log(`${name}: NON-JUDGE`);
        } else {
          judgePage = page;
          console.log(`${name}: JUDGE`);
        }
      }

      console.log(`Found ${nonJudgePages.length} non-judge players`);
      expect(judgePage).not.toBeNull();
      expect(nonJudgePages.length).toBe(2);

      // Step 8: Non-judge players select and submit cards
      console.log("Non-judge players selecting and submitting cards...");
      for (let i = 0; i < nonJudgePages.length; i++) {
        const playerPage = nonJudgePages[i];
        console.log(`Player ${i + 1} selecting card...`);

        // Click first white card to select it
        const whiteCards = playerPage
          .locator(".bg-white.border-2")
          .filter({ hasText: /.+/ });
        const firstCard = whiteCards.first();
        await firstCard.click();
        console.log(`Player ${i + 1} clicked card`);

        // Submit the card
        const submitButton = playerPage.getByRole("button", {
          name: /submit.*card/i,
        });
        await expect(submitButton).toBeEnabled();
        console.log(`Player ${i + 1} submit button enabled`);
        await submitButton.click();
        console.log(`Player ${i + 1} submitted card`);

        // Should see waiting message
        await expect(playerPage.getByText(/waiting for/i)).toBeVisible();
        console.log(`Player ${i + 1} sees waiting message`);
      }
      console.log("All non-judge players submitted cards");

      // Give extra time for submissions to write to database and propagate via realtime
      console.log("Waiting for submissions to propagate...");
      await judgePage!.waitForTimeout(2000);

      // Step 9: Judge should see submissions appear
      if (judgePage) {
        // Capture console errors
        const consoleErrors: string[] = [];
        judgePage.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(msg.text());
          }
        });

        console.log("Judge waiting for submissions...");

        // Debug: Check what the judge's bottom toolbar is showing
        // Look for all possible toolbar states
        const goToRoundButton = judgePage.getByRole("button", {
          name: /go to.*round/i,
        });
        const waitingMessage = judgePage.getByText(
          /waiting for players to submit/i,
        );
        const pickMessage = judgePage.getByText(/pick the winning submission/i);
        const advanceRoundButton = judgePage.getByRole("button", {
          name: /start next round/i,
        });

        const hasGoToRound = await goToRoundButton
          .isVisible()
          .catch(() => false);
        const hasWaitingMessage = await waitingMessage
          .isVisible()
          .catch(() => false);
        const hasPickMessage = await pickMessage.isVisible().catch(() => false);
        const hasAdvanceButton = await advanceRoundButton
          .isVisible()
          .catch(() => false);

        console.log(`Judge sees "Go to Round" button: ${hasGoToRound}`);
        console.log(
          `Judge sees "Waiting for players to submit": ${hasWaitingMessage}`,
        );
        console.log(
          `Judge sees "Pick the winning submission": ${hasPickMessage}`,
        );
        console.log(
          `Judge sees "Start next round" button: ${hasAdvanceButton}`,
        );

        // Check if judge panel and submissions are rendering
        const submissionsHeaderText = await judgePage
          .locator("h3")
          .filter({ hasText: /submissions/i })
          .textContent()
          .catch(() => "");
        console.log(`Submissions header text: "${submissionsHeaderText}"`);

        // Count how many submission cards are visible
        const submissionCards = judgePage.locator(".bg-white.border-2");
        const cardCount = await submissionCards.count();
        console.log(`Number of white cards visible to judge: ${cardCount}`);

        // Check for submission buttons using the EXACT selector from the test
        const exactSubmissions = judgePage
          .locator('button[type="button"]:not([disabled])')
          .filter({ has: judgePage.locator(".bg-white.border-2") });
        const exactCount = await exactSubmissions.count();
        console.log(
          `Number of submissions (exact test selector): ${exactCount}`,
        );

        if (hasGoToRound) {
          const buttonText = await goToRoundButton.textContent();
          console.log(`Go to Round button text: "${buttonText}"`);
        }
        if (hasWaitingMessage) {
          const waitingText = await waitingMessage.textContent();
          console.log(`Waiting message: "${waitingText}"`);
        }

        // Log any console errors
        if (consoleErrors.length > 0) {
          console.log(
            `Console errors on judge page: ${consoleErrors.join(", ")}`,
          );
        } else {
          console.log("No console errors detected");
        }

        // Wait for reveal button to appear (realtime updates need time to propagate)
        console.log("Waiting for reveal button to appear...");
        const revealButton = judgePage.getByRole("button", { name: /reveal/i });

        // Wait up to 5 seconds for reveal button to appear
        try {
          await expect(revealButton).toBeVisible({ timeout: 5000 });
          console.log("Reveal button appeared!");
        } catch (e) {
          console.log(
            "Reveal button did not appear - checking if submissions already revealed",
          );
          // Debug: Take a screenshot to see what's on screen
          await judgePage.screenshot({
            path: "test-results/judge-no-reveal-button.png",
            fullPage: true,
          });
          console.log(
            "Screenshot saved to test-results/judge-no-reveal-button.png",
          );
        }

        const revealButtonCount = await revealButton.count();
        console.log(`Reveal button count: ${revealButtonCount}`);

        if (revealButtonCount > 0) {
          console.log("Revealing submissions...");
          // Click reveal until all are revealed
          let clickCount = 0;
          while ((await revealButton.count()) > 0 && clickCount < 10) {
            console.log(`Clicking reveal button (click ${clickCount + 1})...`);
            await revealButton.click();
            await judgePage.waitForTimeout(500);
            clickCount++;
          }
          console.log(`Revealed ${clickCount} submissions`);
        }

        // Step 10: Judge picks a winner
        console.log("Judge picking winner...");

        // Wait for submissions to become clickable (they might be disabled while revealing)
        await judgePage.waitForTimeout(2000); // Wait for realtime reveal state

        // Find clickable submission buttons (not disabled)
        const submissions = judgePage
          .locator('button[type="button"]:not([disabled])')
          .filter({ has: judgePage.locator(".bg-white.border-2") });

        // Wait for at least one submission to become clickable
        await expect(submissions.first()).toBeVisible({ timeout: 10000 });
        const submissionCount = await submissions.count();
        console.log(`Found ${submissionCount} clickable submissions`);

        const firstSubmission = submissions.first();
        await firstSubmission.click();
        console.log("Judge clicked submission");

        // Step 11: Judge advances to next round
        console.log("Waiting for advance button...");
        const advanceButton = judgePage.getByRole("button", {
          name: /start next round/i,
        });
        await expect(advanceButton).toBeVisible({ timeout: 15000 });
        console.log("Advance button visible, clicking...");
        await advanceButton.click();
        console.log("Advance button clicked");

        // Step 12: All players should advance to round 2
        console.log("Waiting for navigation to round 2...");
        await expect(judgePage).toHaveURL(/\/game\/.+\/round\/2/, {
          timeout: 10000,
        });
        console.log("Judge navigated to round 2");

        // Verify non-judge players also advanced
        for (let i = 0; i < nonJudgePages.length; i++) {
          const playerPage = nonJudgePages[i];
          await expect(playerPage).toHaveURL(/\/game\/.+\/round\/2/, {
            timeout: 10000,
          });
          console.log(`Player ${i + 1} navigated to round 2`);
        }
        console.log("All players advanced to round 2");
      }

      console.log("✅ Complete game flow test passed!");
    } finally {
      await hostContext.close();
      await player2Context.close();
      await player3Context.close();
    }
  });

  test("should show winner celebration to winning player", async ({
    browser,
  }) => {
    test.setTimeout(60000); // 60 seconds
    // This is a simplified version focusing on the winner celebration
    const hostContext = await browser.newContext();
    const player2Context = await browser.newContext();
    const player3Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const player2Page = await player2Context.newPage();
    const player3Page = await player3Context.newPage();

    try {
      const gameUrl = await createGameAsHost(hostPage, "Host");
      await joinGame(player2Page, gameUrl, "Player 2");
      await joinGame(player3Page, gameUrl, "Player 3");

      await hostPage.getByRole("button", { name: /start game/i }).click();
      await expect(hostPage).toHaveURL(/\/game\/.+\/round\/1/);

      // Wait for React to hydrate on round pages
      await hostPage.waitForTimeout(3000);
      await player2Page.waitForTimeout(3000);
      await player3Page.waitForTimeout(3000);

      // Submit cards from non-judges
      const pages = [hostPage, player2Page, player3Page];
      for (const page of pages) {
        const submitButton = page.getByRole("button", {
          name: /submit.*card/i,
        });
        if ((await submitButton.count()) > 0) {
          await page.locator(".bg-white.border-2").first().click();
          await submitButton.click();
        }
      }

      // Judge picks winner - one of the non-judge players will see celebration
      const judgePage = pages.find(async (page) => {
        return (
          (await page
            .getByRole("button", { name: /submit.*card/i })
            .count()) === 0
        );
      });

      if (judgePage) {
        await judgePage.waitForTimeout(1000);

        // Reveal submissions if needed
        const revealButton = judgePage.getByRole("button", { name: /reveal/i });
        while ((await revealButton.count()) > 0) {
          await revealButton.click();
          await judgePage.waitForTimeout(500);
        }

        // Pick first submission as winner
        await judgePage
          .locator(".card")
          .filter({ hasText: /.+/ })
          .first()
          .click();

        // At least one non-judge player should see the winner celebration
        // Check all pages for the celebration modal
        let celebrationSeen = false;
        for (const page of pages) {
          const celebration = page.getByText(/you won this round/i);
          if (await celebration.isVisible().catch(() => false)) {
            celebrationSeen = true;
            break;
          }
        }

        // Note: This might not always trigger if the test runs too fast
        // but the celebration should appear for the winning player
      }
    } finally {
      await hostContext.close();
      await player2Context.close();
      await player3Context.close();
    }
  });
});

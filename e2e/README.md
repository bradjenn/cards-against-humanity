# E2E Tests

End-to-end tests for the Cards Against Humanity game using Playwright.

## Prerequisites

- Node.js installed
- Dependencies installed: `npm install`
- Playwright browsers installed: `npx playwright install chromium`

## Running Tests

### Run all tests (headless mode)
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Debug tests (step through with browser)
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/create-game.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

## Test Files

### `create-game.spec.ts`
Tests for creating new games:
- Creating a game successfully
- Validation errors (no name, no packs)
- Select all/deselect all packs functionality

### `join-game.spec.ts`
Tests for joining existing games:
- Second player joining a game
- Multiple players in lobby
- Copy invite link functionality
- Join validation errors

### `game-flow.spec.ts`
Tests for complete game flow:
- Full round with 3 players (create, join, start, submit, judge, advance)
- Winner celebration display
- Round progression

## Test Structure

Each test uses multiple browser contexts to simulate multiple players:
- `hostContext` - The player who creates the game
- `player2Context` - Second player joining
- `player3Context` - Third player (minimum required to start)

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Dev server automatically starts before tests
- Tests run in Chromium browser
- Reports saved to `playwright-report/`

## Debugging Tips

1. **Use UI Mode** for the best debugging experience:
   ```bash
   npm run test:e2e:ui
   ```

2. **Add test.only()** to run a single test:
   ```typescript
   test.only('should create a new game', async ({ page }) => {
     // test code
   });
   ```

3. **Use page.pause()** to stop execution and inspect:
   ```typescript
   await page.pause();
   ```

4. **Check screenshots on failure**:
   Screenshots are automatically captured in `test-results/` on failure

## CI/CD Integration

The tests are configured to:
- Run in headless mode on CI
- Retry failed tests 2 times
- Generate HTML reports
- Run tests sequentially (not in parallel) for stability

## Writing New Tests

Example test structure:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/');

    // Interact
    await page.getByRole('button', { name: /click me/i }).click();

    // Assert
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

## Common Issues

### Port 3000 already in use
Stop your dev server and let Playwright start it automatically, or change the port in `playwright.config.ts`.

### Tests timing out
Increase timeout for specific tests:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

### Database state issues
Tests run against your actual database. Consider:
- Using a test database
- Implementing cleanup between tests
- Using unique game slugs/names

## Known Issues

### Game Flow Tests (Partially Working)

The multi-player game flow tests (e.g., "should complete a full game round with 3 players") may occasionally fail due to timing issues with realtime updates across multiple browser contexts. These tests work in isolation but can be flaky when run in parallel.

**Workaround**: Run game flow tests individually with:
```bash
npx playwright test e2e/game-flow.spec.ts --workers=1
```

**Root cause**: The tests require careful synchronization of:
- React hydration across multiple pages
- TanStack Query data loading
- Supabase realtime subscriptions
- Multi-player state updates

## React Hydration

The tests use a helper function `gotoAndWaitForHydration()` to ensure React has fully hydrated before interacting with the page. This prevents issues where elements are visible but onClick handlers aren't attached yet.

The helper waits for:
1. Vite client to connect (indicates client-side JS has loaded)
2. Additional 1.5 seconds for React to hydrate and attach event handlers

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)

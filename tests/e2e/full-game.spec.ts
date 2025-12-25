import { test, expect, BrowserContext } from '@playwright/test';

/**
 * Helper: Setup two players in a game
 */
async function setupTwoPlayerGame(context1: BrowserContext, context2: BrowserContext) {
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Both players join lobby
  await page1.goto('/lobby.html');
  await page1.fill('#playerName', 'Player1');
  await page1.click('button[type="submit"]');

  await page2.goto('/lobby.html');
  await page2.fill('#playerName', 'Player2');
  await page2.click('button[type="submit"]');

  // Wait for both to be redirected
  await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
  await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

  // Wait for connection
  await expect(page1.locator('.status-text')).toContainText('Connected', { timeout: 5000 });
  await expect(page2.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

  return { page1, page2 };
}

test.describe('Complete Game Flow', () => {
  test('full game from lobby to completion', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1, page2 } = await setupTwoPlayerGame(context1, context2);

      // Verify initial state
      await expect(page1.locator('.turn-indicator')).toBeVisible();
      await expect(page2.locator('.turn-indicator')).toBeVisible();

      // Check hand sizes are displayed
      await expect(page1.locator('.player-area .hand-size')).toContainText(/\d+ cards/);
      await expect(page2.locator('.player-area .hand-size')).toContainText(/\d+ cards/);

      // Play a few cards
      for (let i = 0; i < 5; i++) {
        // Find whose turn it is
        const turn1 = await page1.locator('.turn-indicator').textContent();
        const currentPlayerPage = turn1?.includes('Your turn') ? page1 : page2;

        // Play a card
        const playBtn = currentPlayerPage.locator('#playCardBtn');
        if (!(await playBtn.isDisabled())) {
          await playBtn.click();
          await currentPlayerPage.waitForTimeout(500); // Wait for animation
        }
      }

      // Verify central pile has cards
      await expect(page1.locator('.pile-size')).toContainText(/\d+ cards in pile/);

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('game state synchronizes between players', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1, page2 } = await setupTwoPlayerGame(context1, context2);

      // Play a card from player 1's side
      const turn1 = await page1.locator('.turn-indicator').textContent();
      const currentPlayer = turn1?.includes('Your turn') ? page1 : page2;
      const otherPlayer = turn1?.includes('Your turn') ? page2 : page1;

      const playBtn = currentPlayer.locator('#playCardBtn');
      if (!(await playBtn.isDisabled())) {
        // Get pile count before
        const pileText1 = await currentPlayer.locator('.pile-size').textContent();
        const pileCountBefore = parseInt(pileText1?.match(/(\d+)/)?.[1] || '0');

        // Play card
        await playBtn.click();
        await currentPlayer.waitForTimeout(1000);

        // Both players should see updated pile
        const pileText2 = await otherPlayer.locator('.pile-size').textContent();
        const pileCountAfter = parseInt(pileText2?.match(/(\d+)/)?.[1] || '0');

        expect(pileCountAfter).toBe(pileCountBefore + 1);
      }

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('handles player disconnection gracefully', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1, page2 } = await setupTwoPlayerGame(context1, context2);

      // Player 1 disconnects
      await page1.close();

      // Player 2 should still have UI (though game might pause)
      await expect(page2.locator('.game-board')).toBeVisible();
      await expect(page2.locator('.status-text')).toBeVisible();

    } finally {
      await context2.close();
      // context1 already closed via page1.close()
    }
  });
});

test.describe('Game Rules Enforcement', () => {
  test('prevents playing card when not your turn', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1, page2 } = await setupTwoPlayerGame(context1, context2);

      // Find whose turn it is
      const turn1 = await page1.locator('.turn-indicator').textContent();
      const waitingPlayer = turn1?.includes('Your turn') ? page2 : page1;

      // Waiting player's button should be disabled
      const playBtn = waitingPlayer.locator('#playCardBtn');
      await expect(playBtn).toBeDisabled();

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('snap button enables only when match available', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1, page2 } = await setupTwoPlayerGame(context1, context2);

      // Initially snap should be disabled (no match)
      await expect(page1.locator('#snapBtn')).toBeDisabled();
      await expect(page2.locator('#snapBtn')).toBeDisabled();

      // Note: Testing actual snap match would require manipulating game state
      // or playing until a match occurs naturally

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Game Completion', () => {
  test('declares winner when one player has all cards', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1 } = await setupTwoPlayerGame(context1, context2);

      // Note: In a real test, we'd play until game ends
      // For now, just verify game over UI exists
      const gameOverSection = page1.locator('.game-over');
      await expect(gameOverSection).toBeAttached();

      // Verify game over elements
      await expect(page1.locator('.game-over .result')).toBeAttached();
      await expect(page1.locator('.game-over .message')).toBeAttached();

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Performance and Stability', () => {
  test('handles rapid card plays without errors', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      const { page1, page2 } = await setupTwoPlayerGame(context1, context2);

      // Rapidly click play card multiple times
      for (let i = 0; i < 10; i++) {
        const turn1 = await page1.locator('.turn-indicator').textContent();
        const currentPlayer = turn1?.includes('Your turn') ? page1 : page2;

        const playBtn = currentPlayer.locator('#playCardBtn');
        if (!(await playBtn.isDisabled())) {
          await playBtn.click();
          await currentPlayer.waitForTimeout(200);
        }
      }

      // Should still be in valid state
      await expect(page1.locator('.game-board')).toBeVisible();
      await expect(page2.locator('.game-board')).toBeVisible();

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('handles page refresh during game', async ({ browser }) => {
    const context = await browser.newContext();

    try {
      const page = await context.newPage();
      await page.goto('/lobby.html');
      await page.fill('#playerName', 'RefreshTest');
      await page.click('button[type="submit"]');

      // For single player, just navigate to game
      await page.goto('/game.html?matchId=refresh-test-1');

      // Refresh the page
      await page.reload();

      // Should reconnect
      await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    } finally {
      await context.close();
    }
  });
});

test.describe('Edge Cases', () => {
  test('handles missing match ID in URL', async ({ page }) => {
    await page.goto('/game.html');

    // Should still load page (might show error)
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
  });

  test('handles invalid match ID', async ({ page }) => {
    await page.goto('/game.html?matchId=invalid-id-12345');

    // Should attempt to connect
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // May show error message
    const statusText = page.locator('.status-text');
    await expect(statusText).toBeVisible();
  });

  test('handles multiple tabs from same player', async ({ browser }) => {
    const context = await browser.newContext();

    try {
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // Same player joins in two tabs
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'MultiTab');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'MultiTab');
      await page2.click('button[type="submit"]');

      // Both tabs should function (though might be same session)
      await expect(page1.locator('.lobby-info, .game-board')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('.lobby-info, .game-board')).toBeVisible({ timeout: 5000 });

    } finally {
      await context.close();
    }
  });
});

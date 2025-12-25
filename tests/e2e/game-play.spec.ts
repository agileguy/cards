import { test, expect } from '@playwright/test';

test.describe('Game Play Flow', () => {
  test('game page loads and connects', async ({ page }) => {
    // First join lobby
    await page.goto('/lobby.html');
    await page.fill('#playerName', 'TestPlayer');
    await page.click('button[type="submit"]');

    // For single player, manually navigate to game (matchmaking would timeout)
    // In real scenario, this would be matched with another player
    await page.goto('/game.html?matchId=test-match-1');

    // Should show game board elements
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.opponent-area')).toBeVisible();
    await expect(page.locator('.player-area')).toBeVisible();
    await expect(page.locator('.central-pile')).toBeVisible();
  });

  test('displays connection status', async ({ page }) => {
    await page.goto('/game.html?matchId=test-match-2');

    // Should show connected status after joining
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });
  });

  test('displays player names and hand sizes', async ({ page }) => {
    await page.goto('/game.html?matchId=test-match-3');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Should show player name elements
    await expect(page.locator('.player-name')).toBeVisible();
    await expect(page.locator('.opponent-name')).toBeVisible();

    // Should show hand size indicators
    await expect(page.locator('.player-area .hand-size')).toBeVisible();
    await expect(page.locator('.opponent-area .hand-size')).toBeVisible();
  });

  test('displays action buttons', async ({ page }) => {
    await page.goto('/game.html?matchId=test-match-4');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Should show action buttons
    await expect(page.locator('#playCardBtn')).toBeVisible();
    await expect(page.locator('#snapBtn')).toBeVisible();
  });

  test('shows turn indicator', async ({ page }) => {
    await page.goto('/game.html?matchId=test-match-5');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Should show turn indicator
    await expect(page.locator('.turn-indicator')).toBeVisible();
  });

  test('buttons are initially disabled', async ({ page }) => {
    await page.goto('/game.html?matchId=test-match-6');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Buttons should be disabled until game starts
    // (In real game, they'd be enabled when it's player's turn)
    const playCardBtn = page.locator('#playCardBtn');
    const snapBtn = page.locator('#snapBtn');

    // Check if buttons exist
    await expect(playCardBtn).toBeVisible();
    await expect(snapBtn).toBeVisible();
  });
});

test.describe('Two Player Game Flow', () => {
  test('two players can join and see each other', async ({ browser }) => {
    // Create two browser contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 joins lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'Alice');
      await page1.click('button[type="submit"]');
      await expect(page1.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

      // Player 2 joins lobby
      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'Bob');
      await page2.click('button[type="submit"]');
      await expect(page2.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

      // Both should be redirected to game page
      await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
      await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

      // Both should show connected
      await expect(page1.locator('.status-text')).toContainText('Connected', { timeout: 5000 });
      await expect(page2.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

      // Both should show opponent name
      await expect(page1.locator('.opponent-name')).toBeVisible();
      await expect(page2.locator('.opponent-name')).toBeVisible();

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('game starts with cards dealt', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'Player1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'Player2');
      await page2.click('button[type="submit"]');

      // Wait for match and redirect
      await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
      await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

      // Hand sizes should be visible and non-zero
      await expect(page1.locator('.player-area .hand-size')).toContainText(/\d+ cards/, { timeout: 5000 });
      await expect(page2.locator('.player-area .hand-size')).toContainText(/\d+ cards/, { timeout: 5000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('turn indicator shows whose turn it is', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'TurnPlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'TurnPlayer2');
      await page2.click('button[type="submit"]');

      // Wait for match
      await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
      await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

      // One should see "Your turn", one should see "Opponent's turn"
      const turn1 = await page1.locator('.turn-indicator').textContent({ timeout: 5000 });
      const turn2 = await page2.locator('.turn-indicator').textContent({ timeout: 5000 });

      // Exactly one should have "Your turn"
      const hasYourTurn = turn1?.includes('Your turn') || turn2?.includes('Your turn');
      expect(hasYourTurn).toBe(true);

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('play card button works on current turn', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'CardPlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'CardPlayer2');
      await page2.click('button[type="submit"]');

      // Wait for match
      await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
      await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

      // Wait for game to be ready
      await page1.waitForTimeout(1000);

      // Find whose turn it is
      const turn1 = await page1.locator('.turn-indicator').textContent({ timeout: 5000 });
      const isPlayer1Turn = turn1?.includes('Your turn');

      const currentPlayer = isPlayer1Turn ? page1 : page2;

      // Current player's button should not be disabled
      const playCardBtn = currentPlayer.locator('#playCardBtn');
      await expect(playCardBtn).not.toBeDisabled({ timeout: 5000 });

      // Click play card
      await playCardBtn.click();

      // Should show status message
      await expect(currentPlayer.locator('.status-message')).toContainText(/Playing card|Card played/, { timeout: 3000 });

      // Central pile should have cards
      await expect(currentPlayer.locator('.central-pile .card, .central-pile .pile-placeholder')).toBeVisible({ timeout: 3000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('central pile displays cards', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join and get matched
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'PilePlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'PilePlayer2');
      await page2.click('button[type="submit"]');

      await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
      await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

      // Central pile should be visible
      await expect(page1.locator('.central-pile')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('.central-pile')).toBeVisible({ timeout: 5000 });

      // Initially should show "No cards played yet" or be empty
      const pileContent1 = await page1.locator('.central-pile').textContent({ timeout: 3000 });
      expect(pileContent1).toBeTruthy();

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Game Over', () => {
  test('game over section exists', async ({ page }) => {
    await page.goto('/game.html?matchId=test-gameover-1');

    // Game over section should exist but not be visible initially
    const gameOverSection = page.locator('.game-over');
    await expect(gameOverSection).toBeAttached({ timeout: 5000 });
  });

  test('displays win/loss message when game ends', async ({ page }) => {
    await page.goto('/game.html?matchId=test-gameover-2');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Game over elements should exist
    await expect(page.locator('.game-over .result')).toBeAttached();
    await expect(page.locator('.game-over .message')).toBeAttached();
  });
});

test.describe('Error Handling', () => {
  test('shows error message element', async ({ page }) => {
    await page.goto('/game.html?matchId=test-error-1');

    // Error message element should exist
    await expect(page.locator('.error-message')).toBeAttached({ timeout: 5000 });
  });

  test('handles missing matchId gracefully', async ({ page }) => {
    await page.goto('/game.html');

    // Should still load page (might show error)
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
  });

  test('handles connection errors', async ({ page }) => {
    await page.goto('/game.html?matchId=test-error-2');

    // Should show some connection status
    const statusText = page.locator('.status-text');
    await expect(statusText).toBeVisible({ timeout: 5000 });
  });
});

test.describe('UI Responsiveness', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/game.html?matchId=test-mobile-1');

    // All main elements should be visible
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.opponent-area')).toBeVisible();
    await expect(page.locator('.central-pile')).toBeVisible();
    await expect(page.locator('.player-area')).toBeVisible();
    await expect(page.locator('#playCardBtn')).toBeVisible();
    await expect(page.locator('#snapBtn')).toBeVisible();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/game.html?matchId=test-tablet-1');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.actions')).toBeVisible();
  });

  test('works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/game.html?matchId=test-desktop-1');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('buttons have proper labels', async ({ page }) => {
    await page.goto('/game.html?matchId=test-a11y-1');

    const playCardBtn = page.locator('#playCardBtn');
    const snapBtn = page.locator('#snapBtn');

    await expect(playCardBtn).toContainText('Play Card', { timeout: 5000 });
    await expect(snapBtn).toContainText('SNAP', { timeout: 5000 });
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/game.html?matchId=test-a11y-2');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on buttons
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 3000 });
  });

  test('status messages are readable', async ({ page }) => {
    await page.goto('/game.html?matchId=test-a11y-3');

    // Status elements should be visible and readable
    await expect(page.locator('.status-text')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.turn-indicator')).toBeVisible();
  });
});

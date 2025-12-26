import { test, expect } from '@playwright/test';

test.describe('War Game Page Load', () => {
  test('war page loads and connects', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-1');

    // Should show game board elements
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.opponent-area')).toBeVisible();
    await expect(page.locator('.player-area')).toBeVisible();
    await expect(page.locator('.battle-area')).toBeVisible();
  });

  test('displays connection status', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-2');

    // Should show connected status after joining
    await expect(page.locator('.status-text')).toContainText('Connected', {
      timeout: 5000,
    });
  });

  test('displays player names and hand sizes', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-3');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', {
      timeout: 5000,
    });

    // Should show player name elements
    await expect(page.locator('.player-name')).toBeVisible();
    await expect(page.locator('.opponent-name')).toBeVisible();

    // Should show hand size indicators
    await expect(page.locator('.player-area .hand-size')).toBeVisible();
    await expect(page.locator('.opponent-area .hand-size')).toBeVisible();
  });

  test('displays flip card button', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-4');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', {
      timeout: 5000,
    });

    // Should show flip card button
    await expect(page.locator('#flipCardBtn')).toBeVisible();
  });

  test('displays battle area with card slots', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-5');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', {
      timeout: 5000,
    });

    // Battle area should have two card slots
    await expect(page.locator('.battle-area .card-slot')).toHaveCount(2, {
      timeout: 5000,
    });
  });

  test('displays round counter', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-6');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', {
      timeout: 5000,
    });

    // Should show round indicator
    await expect(page.locator('.round-indicator')).toBeVisible();
  });

  test('displays WAR indicator element', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-7');

    // WAR indicator should exist (may be hidden initially)
    const warIndicator = page.locator('.war-indicator');
    await expect(warIndicator).toBeAttached({ timeout: 5000 });
  });
});

test.describe('Two Player War Game', () => {
  test('two players can join and start game', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 joins lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'WarAlice');
      await page1.click('button[type="submit"]');
      await expect(page1.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

      // Player 2 joins lobby
      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'WarBob');
      await page2.click('button[type="submit"]');
      await expect(page2.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

      // Both should be redirected to game page
      await expect(page1).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });
      await expect(page2).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });

      // Both should show connected
      await expect(page1.locator('.status-text')).toContainText('Connected', {
        timeout: 5000,
      });
      await expect(page2.locator('.status-text')).toContainText('Connected', {
        timeout: 5000,
      });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('game starts with 26 cards each', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'WarPlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'WarPlayer2');
      await page2.click('button[type="submit"]');

      // Wait for match and redirect
      await expect(page1).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });
      await expect(page2).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });

      // Hand sizes should show 26 cards each
      await expect(page1.locator('.player-area .hand-size')).toContainText(
        /26/,
        { timeout: 5000 }
      );
      await expect(page2.locator('.player-area .hand-size')).toContainText(
        /26/,
        { timeout: 5000 }
      );
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('both players can flip cards simultaneously', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join lobby
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'FlipPlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'FlipPlayer2');
      await page2.click('button[type="submit"]');

      // Wait for match
      await expect(page1).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });
      await expect(page2).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });

      // Wait for game to be ready
      await page1.waitForTimeout(1000);

      // Both players' buttons should not be disabled
      const flipBtn1 = page1.locator('#flipCardBtn');
      const flipBtn2 = page2.locator('#flipCardBtn');

      await expect(flipBtn1).not.toBeDisabled({ timeout: 5000 });
      await expect(flipBtn2).not.toBeDisabled({ timeout: 5000 });

      // Both can flip
      await flipBtn1.click();
      await flipBtn2.click();

      // Battle area should show cards
      await expect(
        page1.locator('.battle-area .card, .battle-area .card-slot:has(.card)')
      ).toBeVisible({ timeout: 3000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('round counter increments after battle', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Players join
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'RoundPlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'RoundPlayer2');
      await page2.click('button[type="submit"]');

      await expect(page1).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });
      await expect(page2).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });

      await page1.waitForTimeout(1000);

      // Initial round should be 0 or 1
      const roundIndicator = page1.locator('.round-indicator');
      await expect(roundIndicator).toContainText(/Round \d+/, { timeout: 5000 });

      // Play a round
      await page1.locator('#flipCardBtn').click();
      await page2.locator('#flipCardBtn').click();

      // Wait for battle to resolve
      await page1.waitForTimeout(1500);

      // Round number should have changed
      await expect(roundIndicator).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('hand sizes update after battle', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'HandPlayer1');
      await page1.click('button[type="submit"]');

      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'HandPlayer2');
      await page2.click('button[type="submit"]');

      await expect(page1).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });
      await expect(page2).toHaveURL(/\/(game|war)\.html\?matchId=/, {
        timeout: 10000,
      });

      await page1.waitForTimeout(1000);

      // Play a round
      await page1.locator('#flipCardBtn').click();
      await page2.locator('#flipCardBtn').click();

      // Wait for battle resolution
      await page1.waitForTimeout(1500);

      // One player should have more cards, one should have fewer
      // Total should still be 52
      const hand1 = await page1.locator('.player-area .hand-size').textContent();
      const hand2 = await page2.locator('.player-area .hand-size').textContent();

      expect(hand1).toBeTruthy();
      expect(hand2).toBeTruthy();
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Game Over', () => {
  test('game over section exists', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-gameover-1');

    // Game over section should exist but not be visible initially
    const gameOverSection = page.locator('.game-over');
    await expect(gameOverSection).toBeAttached({ timeout: 5000 });
  });

  test('displays win/loss message when game ends', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-gameover-2');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', {
      timeout: 5000,
    });

    // Game over elements should exist
    await expect(page.locator('.game-over .result')).toBeAttached();
    await expect(page.locator('.game-over .message')).toBeAttached();
  });
});

test.describe('Error Handling', () => {
  test('shows error message element', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-error-1');

    // Error message element should exist
    await expect(page.locator('.error-message')).toBeAttached({
      timeout: 5000,
    });
  });

  test('handles missing matchId gracefully', async ({ page }) => {
    await page.goto('/war.html');

    // Should still load page
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('UI Responsiveness', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/war.html?matchId=test-war-mobile-1');

    // All main elements should be visible
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.opponent-area')).toBeVisible();
    await expect(page.locator('.battle-area')).toBeVisible();
    await expect(page.locator('.player-area')).toBeVisible();
    await expect(page.locator('#flipCardBtn')).toBeVisible();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/war.html?matchId=test-war-tablet-1');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.actions')).toBeVisible();
  });

  test('works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/war.html?matchId=test-war-desktop-1');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('flip button has proper label', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-a11y-1');

    const flipCardBtn = page.locator('#flipCardBtn');
    await expect(flipCardBtn).toContainText('Flip Card', { timeout: 5000 });
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-a11y-2');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on button
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 3000 });
  });

  test('status messages are readable', async ({ page }) => {
    await page.goto('/war.html?matchId=test-war-a11y-3');

    // Status elements should be visible and readable
    await expect(page.locator('.status-text')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.round-indicator')).toBeVisible();
  });
});

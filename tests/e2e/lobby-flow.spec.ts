import { test, expect } from '@playwright/test';

test.describe('Lobby Flow', () => {
  test('should connect to lobby and show waiting state', async ({ page }) => {
    await page.goto('/lobby.html');

    // Fill in player name
    await page.fill('#playerName', 'TestPlayer');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show waiting state
    await expect(page.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

    // Should show connection status
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Should hide the form
    await expect(page.locator('.join-form')).not.toBeVisible();
  });

  test('should show error when player name is empty', async ({ page }) => {
    await page.goto('/lobby.html');

    // Try to submit with empty name
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const nameInput = page.locator('#playerName');
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should update waiting count', async ({ page }) => {
    await page.goto('/lobby.html');

    await page.fill('#playerName', 'Player1');
    await page.click('button[type="submit"]');

    // Wait for lobby info to show
    await expect(page.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

    // Waiting count should be visible
    await expect(page.locator('.waiting-count')).toBeVisible();
    await expect(page.locator('.waiting-count .count')).toBeVisible();
  });

  test('two players should get matched', async ({ browser }) => {
    // Create two browser contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 joins
      await page1.goto('/lobby.html');
      await page1.fill('#playerName', 'Player1');
      await page1.click('button[type="submit"]');
      await expect(page1.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

      // Player 2 joins
      await page2.goto('/lobby.html');
      await page2.fill('#playerName', 'Player2');
      await page2.click('button[type="submit"]');
      await expect(page2.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

      // Both should be redirected to game page
      await expect(page1).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });
      await expect(page2).toHaveURL(/\/game\.html\?matchId=/, { timeout: 10000 });

      // Both should have the same match ID
      const url1 = new URL(page1.url());
      const url2 = new URL(page2.url());
      const matchId1 = url1.searchParams.get('matchId');
      const matchId2 = url2.searchParams.get('matchId');

      expect(matchId1).toBeTruthy();
      expect(matchId1).toBe(matchId2);

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // This test would need a way to simulate server errors
    // For now, we just test that error handling UI exists
    await page.goto('/lobby.html');

    await expect(page.locator('.error-message')).toBeInViewport();
  });
});

test.describe('Lobby Navigation', () => {
  test('should allow navigation back to home', async ({ page }) => {
    await page.goto('/lobby.html');

    const backButton = page.locator('a[href="/"]');
    await expect(backButton).toBeVisible();

    await backButton.click();
    await expect(page).toHaveURL('/');
  });

  test('should maintain connection status', async ({ page }) => {
    await page.goto('/lobby.html');

    // Initially disconnected
    await expect(page.locator('.status-text')).toContainText('Disconnected');

    // After joining, should be connected
    await page.fill('#playerName', 'StatusTest');
    await page.click('button[type="submit"]');

    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });
  });
});

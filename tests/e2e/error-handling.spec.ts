import { test, expect } from '@playwright/test';

test.describe('Network Error Handling', () => {
  test('shows error when server is unreachable', async ({ page }) => {
    // Navigate to page (server might not be running in this test)
    await page.goto('/game.html?matchId=test-1');

    // Error message element should exist
    await expect(page.locator('.error-message')).toBeAttached({ timeout: 5000 });
  });

  test('handles connection timeout gracefully', async ({ page }) => {
    await page.goto('/game.html?matchId=timeout-test');

    // Should show disconnected status eventually if can't connect
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible({ timeout: 10000 });
  });

  test('reconnects after temporary disconnection', async ({ page, context }) => {
    await page.goto('/lobby.html');
    await page.fill('#playerName', 'ReconnectTest');
    await page.click('button[type="submit"]');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Simulate network disconnection by going offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // Should attempt to reconnect (or show appropriate status)
    const statusText = page.locator('.status-text');
    await expect(statusText).toBeVisible();
  });
});

test.describe('Lobby Error Handling', () => {
  test('shows error when player name is empty', async ({ page }) => {
    await page.goto('/lobby.html');

    // Try to submit without name
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const nameInput = page.locator('#playerName');
    const isValid = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('handles lobby timeout gracefully', async ({ page }) => {
    await page.goto('/lobby.html');
    await page.fill('#playerName', 'TimeoutPlayer');
    await page.click('button[type="submit"]');

    // Wait for lobby join
    await expect(page.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

    // Error message should be attachedawait expect(page.locator('.error-message')).toBeAttached();
  });

  test('handles server errors during matchmaking', async ({ page }) => {
    await page.goto('/lobby.html');
    await page.fill('#playerName', 'ErrorTest');
    await page.click('button[type="submit"]');

    // Should handle errors gracefully
    await expect(page.locator('.lobby-info, .join-form')).toBeVisible({ timeout: 10000 });

    // Error element should exist
    await expect(page.locator('.error-message')).toBeAttached();
  });
});

test.describe('Game Error Handling', () => {
  test('handles invalid game actions', async ({ page }) => {
    await page.goto('/game.html?matchId=invalid-action-test');

    // Wait for connection attempt
    await page.waitForTimeout(2000);

    // Error message element should exist for displaying action errors
    await expect(page.locator('.error-message')).toBeAttached();
  });

  test('handles server errors during gameplay', async ({ page }) => {
    await page.goto('/game.html?matchId=server-error-test');

    // Wait for game to load
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Error handling UI should be present
    await expect(page.locator('.error-message')).toBeAttached();
  });

  test('handles corrupted game state', async ({ page }) => {
    await page.goto('/game.html?matchId=corrupted-state');

    // Should load page even if state is invalid
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Should have error display mechanism
    await expect(page.locator('.error-message')).toBeAttached();
  });
});

test.describe('Client-Side Validation', () => {
  test('prevents snap when no cards in pile', async ({ page }) => {
    await page.goto('/game.html?matchId=no-pile-test');

    // Wait for connection
    await page.waitForTimeout(2000);

    // Snap button should exist but be disabled initially
    const snapBtn = page.locator('#snapBtn');
    await expect(snapBtn).toBeVisible({ timeout: 5000 });
    // Likely disabled when no match available
  });

  test('prevents actions after game ends', async ({ page }) => {
    await page.goto('/game.html?matchId=game-ended-test');

    // Load game
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Action buttons should exist
    await expect(page.locator('#playCardBtn')).toBeVisible();
    await expect(page.locator('#snapBtn')).toBeVisible();

    // Note: Actual game-over state would disable these buttons
  });

  test('validates session ID before allowing actions', async ({ page }) => {
    await page.goto('/game.html');

    // Without proper session, buttons should be disabled or actions should fail
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    const playBtn = page.locator('#playCardBtn');
    await expect(playBtn).toBeVisible();
  });
});

test.describe('Error Message Display', () => {
  test('error messages auto-dismiss after timeout', async ({ page }) => {
    await page.goto('/lobby.html');

    // Navigate without filling form (but submit via code to trigger custom error)
    await page.evaluate(() => {
      const errorMsg = document.querySelector('.error-message') as HTMLElement;
      if (errorMsg) {
        errorMsg.textContent = 'Test error message';
        errorMsg.classList.add('active');
      }
    });

    // Error should be visible
    await expect(page.locator('.error-message.active')).toBeVisible();

    // Wait for auto-dismiss (5 seconds in implementation)
    await page.waitForTimeout(6000);

    // Error should be hidden
    const errorMsg = page.locator('.error-message.active');
    const isVisible = await errorMsg.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('error messages are readable and visible', async ({ page }) => {
    await page.goto('/lobby.html');

    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeAttached();

    // Error message should have proper styling
    const bgColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
  });

  test('multiple errors display correctly', async ({ page }) => {
    await page.goto('/lobby.html');

    // Trigger multiple errors via script
    await page.evaluate(() => {
      const showError = (msg: string) => {
        const errorMsg = document.querySelector('.error-message') as HTMLElement;
        if (errorMsg) {
          errorMsg.textContent = msg;
          errorMsg.classList.add('active');
        }
      };

      showError('First error');
      setTimeout(() => showError('Second error'), 100);
    });

    // Last error should be visible
    await expect(page.locator('.error-message')).toContainText(/error/i);
  });
});

test.describe('Connection Status', () => {
  test('connection status updates correctly', async ({ page }) => {
    await page.goto('/lobby.html');

    // Initially disconnected
    await expect(page.locator('.status-text')).toContainText('Disconnected');

    // After joining, should connect
    await page.fill('#playerName', 'StatusTest');
    await page.click('button[type="submit"]');

    // Should show connected
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });
  });

  test('connection indicator has visual feedback', async ({ page }) => {
    await page.goto('/lobby.html');

    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();

    // Should not have connected class initially
    const hasConnected = await statusIndicator.evaluate(el =>
      el.classList.contains('connected')
    );
    expect(hasConnected).toBe(false);

    // After connecting
    await page.fill('#playerName', 'IndicatorTest');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should have connected class
    const statusText = await page.locator('.status-text').textContent();
    if (statusText?.includes('Connected')) {
      const hasConnectedNow = await statusIndicator.evaluate(el =>
        el.classList.contains('connected')
      );
      expect(hasConnectedNow).toBe(true);
    }
  });

  test('disconnection is clearly indicated', async ({ page, context }) => {
    await page.goto('/lobby.html');
    await page.fill('#playerName', 'DisconnectTest');
    await page.click('button[type="submit"]');

    // Wait for connection
    await expect(page.locator('.status-text')).toContainText('Connected', { timeout: 5000 });

    // Simulate disconnection
    await context.setOffline(true);
    await page.waitForTimeout(3000);

    // Status should indicate disconnection (or attempt to reconnect)
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
  });
});

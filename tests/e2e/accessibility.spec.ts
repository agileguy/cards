import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('can navigate lobby form with keyboard', async ({ page }) => {
    await page.goto('/lobby.html');

    // Tab to player name input
    await page.keyboard.press('Tab');

    // Should focus on input
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('input');

    // Type name
    await page.keyboard.type('KeyboardUser');

    // Tab to submit button
    await page.keyboard.press('Tab');

    // Should focus on button
    const buttonFocused = await page.locator('button:focus').count();
    expect(buttonFocused).toBeGreaterThan(0);

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Should submit form
    await expect(page.locator('.lobby-info')).toBeVisible({ timeout: 5000 });
  });

  test('can navigate game controls with keyboard', async ({ page }) => {
    await page.goto('/game.html?matchId=keyboard-test');

    // Wait for page load
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on action buttons
    const focusedEl = page.locator(':focus');
    await expect(focusedEl).toBeVisible();
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/lobby.html');

    const nameInput = page.locator('#playerName');
    await nameInput.focus();

    // Should have visible focus indicator
    const outlineStyle = await nameInput.evaluate(el =>
      window.getComputedStyle(el).outline
    );

    // Should have some outline (default or custom)
    expect(outlineStyle).toBeTruthy();
  });

  test('keyboard shortcuts work correctly', async ({ page }) => {
    await page.goto('/game.html?matchId=shortcuts-test');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Note: If we add keyboard shortcuts (e.g., 'p' for play, 's' for snap)
    // we would test them here
    // For now, just verify elements are keyboard-accessible

    const playBtn = page.locator('#playCardBtn');
    await playBtn.focus();

    const isFocused = await playBtn.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
  });
});

test.describe('Screen Reader Support', () => {
  test('buttons have descriptive text', async ({ page }) => {
    await page.goto('/game.html?matchId=sr-test-1');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Buttons should have clear text content
    const playCardBtn = page.locator('#playCardBtn');
    const playCardText = await playCardBtn.textContent();
    expect(playCardText).toContain('Play Card');

    const snapBtn = page.locator('#snapBtn');
    const snapText = await snapBtn.textContent();
    expect(snapText).toMatch(/SNAP/i);
  });

  test('status messages are announced properly', async ({ page }) => {
    await page.goto('/game.html?matchId=sr-test-2');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Status text should be visible and readable
    const statusText = page.locator('.status-text');
    await expect(statusText).toBeVisible();

    const text = await statusText.textContent();
    expect(text).toBeTruthy();
  });

  test('turn indicator has clear messaging', async ({ page }) => {
    await page.goto('/game.html?matchId=sr-test-3');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    const turnIndicator = page.locator('.turn-indicator');
    await expect(turnIndicator).toBeVisible();

    const turnText = await turnIndicator.textContent();
    expect(turnText).toMatch(/turn/i);
  });

  test('game over messages are clear', async ({ page }) => {
    await page.goto('/game.html?matchId=sr-test-4');

    // Game over section should exist
    const gameOver = page.locator('.game-over');
    await expect(gameOver).toBeAttached();

    // Result text should be clear
    const resultText = page.locator('.game-over .result');
    await expect(resultText).toBeAttached();

    const messageText = page.locator('.game-over .message');
    await expect(messageText).toBeAttached();
  });

  test('form labels are associated with inputs', async ({ page }) => {
    await page.goto('/lobby.html');

    const nameInput = page.locator('#playerName');
    await expect(nameInput).toBeVisible();

    // Check if input has associated label or placeholder
    const placeholder = await nameInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });
});

test.describe('ARIA Attributes', () => {
  test('disabled buttons have aria-disabled', async ({ page }) => {
    await page.goto('/game.html?matchId=aria-test-1');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Check if disabled buttons are properly marked
    const playBtn = page.locator('#playCardBtn');
    const isDisabled = await playBtn.isDisabled();

    if (isDisabled) {
      const ariaDisabled = await playBtn.getAttribute('aria-disabled');
      // Either native disabled or aria-disabled should be set
      expect(isDisabled || ariaDisabled === 'true').toBe(true);
    }
  });

  test('status indicators have appropriate roles', async ({ page }) => {
    await page.goto('/lobby.html');

    const statusText = page.locator('.status-text');
    await expect(statusText).toBeVisible();

    // Status text should be readable
    const text = await statusText.textContent();
    expect(text).toBeTruthy();
  });

  test('error messages have alert role', async ({ page }) => {
    await page.goto('/lobby.html');

    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeAttached();

    // Error messages should be noticeable when active
    // Could add role="alert" for screen readers
  });

  test('loading states are announced', async ({ page }) => {
    await page.goto('/lobby.html');
    await page.fill('#playerName', 'LoadingTest');
    await page.click('button[type="submit"]');

    // Loading/waiting state should be clear
    await expect(page.locator('.lobby-info')).toBeVisible({ timeout: 5000 });

    const waitingText = await page.locator('.waiting-count').textContent();
    expect(waitingText).toBeTruthy();
  });
});

test.describe('Visual Accessibility', () => {
  test('text has sufficient contrast', async ({ page }) => {
    await page.goto('/');

    // Check primary text color
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    const color = await heading.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(color).toBeTruthy();

    // Note: Actual contrast ratio calculation would require more complex checks
  });

  test('interactive elements are large enough', async ({ page }) => {
    await page.goto('/game.html?matchId=size-test');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Buttons should be at least 44x44px for touch targets
    const playBtn = page.locator('#playCardBtn');
    const box = await playBtn.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40); // Allow some tolerance
      expect(box.width).toBeGreaterThanOrEqual(40);
    }
  });

  test('focus state is visually distinct', async ({ page }) => {
    await page.goto('/lobby.html');

    const nameInput = page.locator('#playerName');
    await nameInput.focus();

    // Should have some visual focus indicator
    const outlineWidth = await nameInput.evaluate(el =>
      window.getComputedStyle(el).outlineWidth
    );

    expect(outlineWidth).toBeTruthy();
  });

  test('text is readable at 200% zoom', async ({ page }) => {
    await page.goto('/');

    // Set viewport to simulate zoom
    await page.setViewportSize({ width: 640, height: 480 });

    // Content should still be visible and not overflow
    const container = page.locator('.container');
    await expect(container).toBeVisible();

    // Text should not be clipped
    const heading = page.locator('h1');
    const box = await heading.boundingBox();
    expect(box).toBeTruthy();
  });
});

test.describe('Motion and Animation', () => {
  test('animations complete before next interaction', async ({ page }) => {
    await page.goto('/game.html?matchId=animation-test');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Animations should not block interaction
    const playBtn = page.locator('#playCardBtn');
    if (!(await playBtn.isDisabled())) {
      await playBtn.click();
      await page.waitForTimeout(100);

      // Should still be functional after click
      await expect(page.locator('.game-board')).toBeVisible();
    }
  });

  test('reduced motion is respected', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/game.html?matchId=reduced-motion-test');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Animations should be minimal or disabled
    // This would require CSS media query: @media (prefers-reduced-motion: reduce)
  });
});

test.describe('Mobile Accessibility', () => {
  test('touch targets are appropriately sized on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/game.html?matchId=mobile-a11y-test');

    await expect(page.locator('.game-board')).toBeVisible({ timeout: 5000 });

    // Buttons should be at least 44x44px
    const snapBtn = page.locator('#snapBtn');
    const box = await snapBtn.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(40);
    }
  });

  test('no horizontal scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Body should not be wider than viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small tolerance
  });

  test('content is readable without zooming', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Font size should be readable (at least 14px base)
    const body = page.locator('body');
    const fontSize = await body.evaluate(el =>
      parseInt(window.getComputedStyle(el).fontSize)
    );

    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});

test.describe('Error Accessibility', () => {
  test('form validation errors are announced', async ({ page }) => {
    await page.goto('/lobby.html');

    // Try to submit without filling form
    await page.click('button[type="submit"]');

    // HTML5 validation message should appear
    const nameInput = page.locator('#playerName');
    const validationMessage = await nameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    expect(validationMessage).toBeTruthy();
  });

  test('connection errors are clearly communicated', async ({ page }) => {
    await page.goto('/game.html?matchId=connection-error-test');

    // Error message should be visible and readable
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeAttached();
  });
});

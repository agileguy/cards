import { test, expect } from '@playwright/test';

test.describe('Lobby Page', () => {
  test('should load lobby page', async ({ page }) => {
    await page.goto('/lobby.html');

    // Check that the page loaded
    await expect(page.locator('h1')).toContainText('Lobby');
  });

  test('should have join form', async ({ page }) => {
    await page.goto('/lobby.html');

    // Check for form elements
    await expect(page.locator('#joinLobbyForm')).toBeVisible();
    await expect(page.locator('#playerName')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    await page.goto('/lobby.html');

    // Check connection status indicator exists
    await expect(page.locator('.connection-status')).toBeVisible();
    await expect(page.locator('.status-text')).toBeVisible();
  });

  test('should require player name', async ({ page }) => {
    await page.goto('/lobby.html');

    // Try to submit without name
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // HTML5 validation should prevent submission
    const nameInput = page.locator('#playerName');
    const isValid = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should accept player name input', async ({ page }) => {
    await page.goto('/lobby.html');

    const nameInput = page.locator('#playerName');
    await nameInput.fill('TestPlayer');

    await expect(nameInput).toHaveValue('TestPlayer');
  });
});

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Cards');
    await expect(page.locator('.tagline')).toBeVisible();
  });

  test('should have link to lobby', async ({ page }) => {
    await page.goto('/');

    const lobbyLink = page.locator('a[href="/lobby.html"]');
    await expect(lobbyLink).toBeVisible();
  });

  test('should navigate to lobby', async ({ page }) => {
    await page.goto('/');

    await page.click('a[href="/lobby.html"]');
    await expect(page).toHaveURL('/lobby.html');
    await expect(page.locator('h1')).toContainText('Lobby');
  });
});

test.describe('Game Page', () => {
  test('should load game page', async ({ page }) => {
    await page.goto('/game.html');

    await expect(page.locator('h1')).toContainText('Snap');
  });

  test('should have game board elements', async ({ page }) => {
    await page.goto('/game.html');

    await expect(page.locator('.game-board')).toBeVisible();
    await expect(page.locator('.opponent-area')).toBeVisible();
    await expect(page.locator('.central-pile')).toBeVisible();
    await expect(page.locator('.player-area')).toBeVisible();
  });

  test('should have game action buttons', async ({ page }) => {
    await page.goto('/game.html');

    await expect(page.locator('#playCardBtn')).toBeVisible();
    await expect(page.locator('#snapBtn')).toBeVisible();
  });

  test('should have buttons disabled initially', async ({ page }) => {
    await page.goto('/game.html');

    await expect(page.locator('#playCardBtn')).toBeDisabled();
    await expect(page.locator('#snapBtn')).toBeDisabled();
  });
});

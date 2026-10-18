import { test, expect } from '@playwright/test';

test.describe('Animated Replay — Visual Results Presentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('switches to Animated Replay and displays authentic discovered matches', async ({ page }) => {
    // Fill sample text and pattern
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('[A-Z]\\d{3}');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('Order A102 confirmed. Order B305 shipped.');

    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).toBeVisible();

    // Switch to Animated Replay
    const replayTab = page.getByRole('tab', { name: /Animated Replay/i });
    await replayTab.click();

    // Check Replay canvas header
    await expect(page.getByText('Live Replay Canvas')).toBeVisible();
    await expect(page.getByText('/[A-Z]\\d{3}/g')).toBeVisible();

    // Replay controls are present
    const playBtn = page.getByRole('button', { name: /Run Animation|Play/i });
    await expect(playBtn).toBeVisible();

    const showAllBtn = page.getByRole('button', { name: 'Show All Matches' });
    await expect(showAllBtn).toBeVisible();

    // Click Show All Matches to reveal all discovered results immediately
    await showAllBtn.click();

    // Verify both match cards are revealed
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).toBeVisible();
    await expect(page.getByText('"A102"')).toBeVisible();
    await expect(page.getByText('"B305"')).toBeVisible();
    await expect(page.getByText('Replay completed (2 matches revealed)')).toBeVisible();

    // Return to Classic Lab
    const returnBtn = page.getByRole('button', { name: 'Classic Lab', exact: true });
    await returnBtn.click();
    await expect(page.getByText('Regular Expression Pattern')).toBeVisible();
  });

  test('controls replay playback with play, pause, next, prev, and speed', async ({ page }) => {
    // Wait for initial matches in Classic Lab
    await expect(page.getByText('Match #1')).toBeVisible();

    // Switch to Animated Replay
    const replayTab = page.getByRole('tab', { name: /Animated Replay/i });
    await replayTab.click();

    // Speed controls
    const speedHalfBtn = page.getByRole('button', { name: '0.5×' });
    await speedHalfBtn.click();

    // Step forward using Next button
    const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
    await nextBtn.click();
    await expect(page.getByText('Match 1 of')).toBeVisible();

    // Step backward using Prev button
    const prevBtn = page.getByRole('button', { name: 'Prev', exact: true });
    await prevBtn.click();
    await expect(page.getByText('Match 0 of')).toBeVisible();

    // Play animation
    const playBtn = page.getByRole('button', { name: /Run Animation|Play/i });
    await playBtn.click();

    // Pause animation
    const pauseBtn = page.getByRole('button', { name: 'Pause' });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // Resume or Replay button appears
    await expect(page.getByRole('button', { name: /Resume|Replay/i })).toBeVisible();
  });
});

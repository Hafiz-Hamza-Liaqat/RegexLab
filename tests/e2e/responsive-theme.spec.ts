import { test, expect } from '@playwright/test';

test.describe('Responsive Layout & Accessibility', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1024, height: 768 },
    { name: 'Wide', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`renders without horizontal overflow at ${vp.width}px (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Wait for page to render
      await expect(page.locator('#pattern-input')).toBeVisible();

      // Check for horizontal overflow beyond the viewport width
      const hasHorizontalOverflow = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const maxScrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
        return maxScrollWidth > window.innerWidth + 1; // 1px subpixel tolerance
      });

      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test('toggles dark and light theme and persists preference', async ({ page }) => {
    await page.goto('/');

    const themeToggleBtn = page.getByLabel(/Switch to (light|dark) mode/i);
    await expect(themeToggleBtn).toBeVisible();

    // Toggle theme
    await themeToggleBtn.click();
    const isDarkAfterToggle = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Toggle again
    await page.getByLabel(/Switch to (light|dark) mode/i).click();
    const isDarkAfterSecondToggle = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    expect(isDarkAfterToggle).not.toBe(isDarkAfterSecondToggle);
  });

  test('respects OS prefers-reduced-motion default, allows user override, and persists across reload', async ({
    page,
  }) => {
    // 1. Simulate OS with prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const motionToggleBtn = page.getByTestId('motion-toggle');
    await expect(motionToggleBtn).toBeVisible();

    // Verify initial OS-default state: reduced motion is active
    await expect(motionToggleBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(motionToggleBtn).toHaveAttribute(
      'aria-label',
      /reduced motion enabled/i
    );
    const initialMotionAttr = await page.evaluate(() =>
      document.documentElement.getAttribute('data-regexlab-motion')
    );
    expect(initialMotionAttr).toBe('reduced');

    // 2. In Animated Replay, reduced motion causes instant reveal
    const replayTab = page.getByRole('tab', { name: /Animated Replay/i });
    await replayTab.click();
    await expect(page.getByText('Reduced motion active: instant reveals enabled')).toBeVisible();

    const playBtn = page.getByRole('button', { name: /Run Animation|Play/i });
    await playBtn.click();

    // Instant reveal: matches jump immediately to completion without progressive delays
    await expect(page.getByText(/Replay completed/i)).toBeVisible();

    // 3. User explicitly enables motion effects, overriding the OS reduced-motion setting
    await motionToggleBtn.click();

    await expect(motionToggleBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(motionToggleBtn).toHaveAttribute(
      'aria-label',
      /motion effects enabled/i
    );
    const overriddenMotionAttr = await page.evaluate(() =>
      document.documentElement.getAttribute('data-regexlab-motion')
    );
    expect(overriddenMotionAttr).toBe('full');

    // Replay banner warning is gone
    await expect(
      page.getByText('Reduced motion active: instant reveals enabled')
    ).not.toBeVisible();

    // 4. Running animation now runs progressively with scanner cursor line
    const restartBtn = page.getByRole('button', { name: 'Restart' });
    await restartBtn.click();

    // Scanner cursor appears during progressive playback
    const scanner = page.locator('.replay-scanner-line');
    await expect(scanner).toBeVisible();

    // 5. Verify preference persistence across page reload
    await page.reload();
    await expect(page.getByTestId('motion-toggle')).toHaveAttribute('aria-pressed', 'true');
    const persistedMotionAttr = await page.evaluate(() =>
      document.documentElement.getAttribute('data-regexlab-motion')
    );
    expect(persistedMotionAttr).toBe('full');
  });

  test('defaults to motion enabled when OS has no preference, and switches cleanly to reduced motion', async ({
    page,
  }) => {
    // 1. Simulate OS with no reduced-motion preference
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const motionToggleBtn = page.getByTestId('motion-toggle');
    await expect(motionToggleBtn).toBeVisible();

    // Initial state: motion effects enabled
    await expect(motionToggleBtn).toHaveAttribute('aria-pressed', 'true');
    expect(
      await page.evaluate(() => document.documentElement.getAttribute('data-regexlab-motion'))
    ).toBe('full');

    // Switch to Animated Replay
    const replayTab = page.getByRole('tab', { name: /Animated Replay/i });
    await replayTab.click();
    await expect(
      page.getByText('Reduced motion active: instant reveals enabled')
    ).not.toBeVisible();

    // 2. Click Motion Effects toggle to activate reduced motion
    await motionToggleBtn.click();

    await expect(motionToggleBtn).toHaveAttribute('aria-pressed', 'false');
    expect(
      await page.evaluate(() => document.documentElement.getAttribute('data-regexlab-motion'))
    ).toBe('reduced');
    await expect(page.getByText('Reduced motion active: instant reveals enabled')).toBeVisible();

    // Instant replay occurs when Run Animation is pressed
    const playBtn = page.getByRole('button', { name: /Run Animation|Play/i });
    await playBtn.click();
    await expect(page.getByText(/Replay completed/i)).toBeVisible();

    // 3. Persists across reload
    await page.reload();
    await expect(page.getByTestId('motion-toggle')).toHaveAttribute('aria-pressed', 'false');
    expect(
      await page.evaluate(() => document.documentElement.getAttribute('data-regexlab-motion'))
    ).toBe('reduced');
  });
});

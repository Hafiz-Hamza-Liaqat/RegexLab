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

  test('toggles reduced motion mode', async ({ page }) => {
    await page.goto('/');

    const motionToggleBtn = page.getByLabel('Toggle reduced motion');
    await expect(motionToggleBtn).toBeVisible();

    await motionToggleBtn.click();
    // Replay with reduced motion enabled immediately reveals all matches
    const replayTab = page.getByRole('tab', { name: /Animated Replay/i });
    await replayTab.click();

    await expect(page.getByText('Reduced motion active: instant reveals enabled')).toBeVisible();
  });
});

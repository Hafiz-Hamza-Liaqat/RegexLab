import { test, expect } from '@playwright/test';

test.describe('Regex Arcade & Learning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('solves mission, awards XP, and persists across reload without duplicate rewards', async ({ page }) => {
    // Navigate to Arcade
    const arcadeTab = page.getByRole('tab', { name: /Regex Arcade/i });
    await arcadeTab.click();

    await expect(page.getByText('Regex Detective Arcade')).toBeVisible();
    await expect(page.locator('header').getByText('0 XP')).toBeVisible();

    // Select Mission 1: Number Scout
    await page.getByRole('button', { name: /1\. Number Scout/i }).click();

    // Enter pattern
    const patternInput = page.locator('#mission-pattern-input');
    await patternInput.fill('\\d+');

    // Click Test Solution
    const testSolutionBtn = page.getByRole('button', { name: 'Test Solution' });
    await testSolutionBtn.click();

    // Verification: Case solved banner and XP awarded
    await expect(page.getByText(/Case Solved!/i)).toBeVisible();
    await expect(page.locator('header').getByText('50 XP')).toBeVisible();

    // Click Test Solution again: XP must remain 50 (idempotent, no duplicate reward)
    await testSolutionBtn.click();
    await expect(page.locator('header').getByText('50 XP')).toBeVisible();

    // Reload the page: progress must persist
    await page.reload();
    await expect(page.locator('header').getByText('50 XP')).toBeVisible();

    // Re-open Arcade tab to verify persistent progress
    await page.getByRole('tab', { name: /Regex Arcade/i }).click();
    await expect(page.getByText('1 of 7 Solved')).toBeVisible();
  });

  test('unlocks progressive hints in arcade missions', async ({ page }) => {
    const arcadeTab = page.getByRole('tab', { name: /Regex Arcade/i });
    await arcadeTab.click();

    // Initially 0 hints revealed
    await expect(page.getByText('0 / 3 revealed')).toBeVisible();

    // Click Reveal Hint #1
    await page.getByRole('button', { name: 'Reveal Hint #1' }).click();
    await expect(page.getByText('Hint 1 (Concept):')).toBeVisible();
    await expect(page.getByText('1 / 3 revealed')).toBeVisible();

    // Click Reveal Hint #2
    await page.getByRole('button', { name: 'Reveal Hint #2' }).click();
    await expect(page.getByText('Hint 2 (Structure):')).toBeVisible();
    await expect(page.getByText('2 / 3 revealed')).toBeVisible();

    // Click Reveal Hint #3 (Reference solution)
    await page.getByRole('button', { name: 'Reveal Hint #3' }).click();
    await expect(page.getByText('Hint 3 (Reference Solution):')).toBeVisible();
    await expect(page.getByText('3 / 3 revealed')).toBeVisible();
  });

  test('Learn Regex interactive token explainer and Try in Classic Lab', async ({ page }) => {
    // Navigate to Learn Regex
    const learnTab = page.getByRole('tab', { name: /Learn Regex/i });
    await learnTab.click();

    await expect(page.getByText('Regex Handbook & Token Explainer')).toBeVisible();
    await expect(page.getByText('Interactive Token Explainer')).toBeVisible();

    // Click "Try in Classic Lab" on a learning card
    const tryBtn = page.getByRole('button', { name: 'Try in Classic Lab' }).first();
    await tryBtn.click();

    // Should switch to Classic Lab and load that pattern
    await expect(page.getByText('Regular Expression Pattern')).toBeVisible();
    const patternInput = page.locator('#pattern-input');
    await expect(patternInput).toHaveValue('\\d+\\s\\w+');
  });
});

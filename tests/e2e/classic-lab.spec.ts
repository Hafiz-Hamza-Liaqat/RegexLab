import { test, expect } from '@playwright/test';

test.describe('Classic Lab — Professional Regex Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear storage for fresh test state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('runs typical regex search and displays highlighted matches', async ({ page }) => {
    // Fill pattern and test text
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('[A-Z]\\d{3}');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('Order A102 confirmed. Order B305 shipped. Order C9 pending.');

    // Wait for match cards to appear
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).toBeVisible();
    await expect(page.locator('code', { hasText: 'A102' })).toBeVisible();
    await expect(page.locator('code', { hasText: 'B305' })).toBeVisible();

    // Check highlighted text preview
    const marks = page.locator('mark.match-highlight');
    await expect(marks).toHaveCount(2);
    await expect(marks.nth(0)).toHaveText('A102');
    await expect(marks.nth(1)).toHaveText('B305');
  });

  test('displays clear validation errors for invalid regex expressions', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('[unclosed-bracket');

    // Error alert appears via live evaluation or run
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/Invalid regular expression/i);
  });

  test('inspects numbered and named capture groups accurately', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('Launch date: 2026-10-19 scheduled.');

    await expect(page.getByText('Match #1')).toBeVisible();

    // Capture groups should be rendered in match card
    await expect(page.getByText('$1 (year):')).toBeVisible();
    await expect(page.getByText('"2026"')).toBeVisible();
    await expect(page.getByText('$2 (month):')).toBeVisible();
    await expect(page.getByText('"10"')).toBeVisible();
    await expect(page.getByText('$3 (day):')).toBeVisible();
    await expect(page.getByText('"19"')).toBeVisible();
  });

  test('toggles regex flags and updates search behavior', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('cat');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('cat CAT cAt');

    // Initially case sensitive (only 1 match: lowercase cat)
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).not.toBeVisible();

    // Toggle 'i' flag
    const iFlagBtn = page.getByRole('button', { name: /Ignore Case flag/i });
    await iFlagBtn.click();

    // Now all 3 variations match
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).toBeVisible();
    await expect(page.getByText('Match #3')).toBeVisible();
  });

  test('loads presets consistently', async ({ page }) => {
    const emailPreset = page.getByRole('button', { name: 'Email-like Addresses' });
    await emailPreset.click();

    const patternInput = page.locator('#pattern-input');
    await expect(patternInput).toHaveValue('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');

    // Should automatically run and find matches in preset text
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #3')).toBeVisible();
    await expect(page.getByText(/Demonstrates common email detection/i)).toBeVisible();
  });

  test('clears and resets pattern and flags', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('temporary-pattern');

    // Click Clear
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(patternInput).toHaveValue('');

    // Click Reset
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    // Default preset numbers loaded
    await expect(patternInput).toHaveValue('\\b\\d+(?:\\.\\d+)?\\b');
  });

  test('Find & Replace preview updates live with substitution tokens', async ({ page }) => {
    // Open Find & Replace
    await page.getByRole('button', { name: 'Toggle Find and Replace' }).click();
    await expect(page.getByText('Find & Replace Engine')).toBeVisible();

    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('(\\w+)\\s+costs\\s+\\$(\\d+)');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('Widget costs $15 and Gadget costs $40.');

    const replaceInput = page.locator('#replace-template-input');
    await replaceInput.fill('[$1 is $2 USD]');

    // Verify replaced result preview
    const replacePreview = page.getByLabel('Replaced output preview');
    await expect(replacePreview).toContainText('[Widget is 15 USD] and [Gadget is 40 USD].');
  });

  test('updates both match inspector and replacement preview concurrently during live evaluation', async ({ page }) => {
    // 1. Ensure live evaluation is ON (enabled by default)
    const liveCheckbox = page.getByLabel(/Live evaluation/i);
    await expect(liveCheckbox).toBeChecked();

    // 2. Open Find & Replace panel
    await page.getByRole('button', { name: 'Toggle Find and Replace' }).click();
    await expect(page.getByText('Find & Replace Engine')).toBeVisible();

    // 3. Set replacement template
    const replaceInput = page.locator('#replace-template-input');
    await replaceInput.fill('ITEM-$1');

    // 4. Set pattern and test text
    const patternInput = page.locator('#pattern-input');
    const textArea = page.locator('#test-text-area');

    await patternInput.fill('#(\\d+)');
    await textArea.fill('Ticket #101 assigned, Ticket #202 resolved.');

    // 5. Verify both Match Inspector and Replacement Preview update correctly
    const replacePreview = page.getByLabel('Replaced output preview');
    await expect(replacePreview).toContainText('Ticket ITEM-101 assigned, Ticket ITEM-202 resolved.');
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).toBeVisible();

    // 6. Change pattern and input text rapidly while live evaluation is running
    await patternInput.fill('Ticket #(\\d+)');
    await textArea.fill('Urgent Ticket #999 pending review.');

    // 7. Verify both update concurrently to the new results without stale collisions
    await expect(replacePreview).toContainText('Urgent ITEM-999 pending review.');
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).not.toBeVisible();
    await expect(page.locator('code', { hasText: 'Ticket #999' })).toBeVisible();
  });

  test('manual Run execution with Live evaluation disabled evaluates latest inputs', async ({ page }) => {
    // 1. Disable Live evaluation
    const liveCheckbox = page.getByLabel(/Live evaluation/i);
    await liveCheckbox.uncheck();
    await expect(liveCheckbox).not.toBeChecked();

    // 2. Change pattern and text
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('\\b[A-Z]{3}\\b');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('Codes: ABC, DEF, and GH.');

    // 3. Confirm matches are not auto-evaluated
    await expect(page.getByText('Match #1')).not.toBeVisible();

    // 4. Click Run
    await page.getByRole('button', { name: 'Run regular expression' }).click();

    // 5. Matches appear and manual run feedback badge is shown
    await expect(page.getByText('Match #1')).toBeVisible();
    await expect(page.getByText('Match #2')).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/2 matches found/i);
  });

  test('manual Run during pending debounce immediately evaluates latest input', async ({ page }) => {
    // Live evaluation is on
    const patternInput = page.locator('#pattern-input');
    const textArea = page.locator('#test-text-area');

    await textArea.fill('Alpha Bravo Charlie');
    // Type pattern and immediately click Run before the 220ms debounce
    await patternInput.fill('Bravo');
    await page.getByRole('button', { name: 'Run regular expression' }).click();

    await expect(page.getByText('Match #1', { exact: true })).toBeVisible();
    await expect(page.locator('mark.match-highlight', { hasText: 'Bravo' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/1 match found/i);

    // Wait past debounce window to ensure delayed timer didn't break or clear the result
    await page.waitForTimeout(300);
    await expect(page.getByText('Match #1', { exact: true })).toBeVisible();
    await expect(page.locator('mark.match-highlight', { hasText: 'Bravo' })).toBeVisible();
  });

  test('displays clear no-match state and feedback on zero matches', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('xyzNonExistent999');

    const textArea = page.locator('#test-text-area');
    await textArea.fill('Regular text with no numbers or special codes.');

    await page.getByRole('button', { name: 'Run regular expression' }).click();

    await expect(page.getByRole('paragraph').filter({ hasText: 'No matches found' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/No matches found/i);
    await expect(page.getByText(/The current regular expression did not match any text/i)).toBeVisible();
  });

  test('invalid pattern displays error alert and Run button recovers upon fix', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    await patternInput.fill('(?<incomplete');

    await page.getByRole('button', { name: 'Run regular expression' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/Invalid regular expression/i);

    // Fix pattern
    await patternInput.fill('\\d+');
    const textArea = page.locator('#test-text-area');
    await textArea.fill('Sample 123 test 456');

    const runButton = page.getByRole('button', { name: 'Run regular expression' });
    await expect(runButton).toBeEnabled();
    await runButton.click();

    await expect(page.getByRole('alert')).not.toBeVisible();
    await expect(page.getByText('Match #1', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/2 matches found/i);
  });

  test('manual Run with Find & Replace open updates both matches and replacement preview', async ({ page }) => {
    // Disable live evaluation so we explicitly test manual Run
    await page.getByLabel(/Live evaluation/i).uncheck();

    await page.getByRole('button', { name: 'Toggle Find and Replace' }).click();
    await expect(page.getByText('Find & Replace Engine')).toBeVisible();

    const patternInput = page.locator('#pattern-input');
    const textArea = page.locator('#test-text-area');
    const replaceInput = page.locator('#replace-template-input');

    await patternInput.fill('foo');
    await textArea.fill('foo and bar and foo');
    await replaceInput.fill('baz');

    await page.getByRole('button', { name: 'Run regular expression' }).click();

    const replacePreview = page.getByLabel('Replaced output preview');
    await expect(replacePreview).toContainText('baz and bar and baz');
    await expect(page.getByText('Match #1', { exact: true })).toBeVisible();
    await expect(page.getByText('Match #2', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/2 matches found/i);
  });

  test('Next Pattern button advances preset, pattern, flags, and sample text', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    // Initial preset is Numbers & Quantities
    await expect(patternInput).toHaveValue('\\b\\d+(?:\\.\\d+)?\\b');

    // Click Next Pattern
    const nextBtn = page.getByRole('button', { name: /Load the next regex pattern/i });
    await nextBtn.click();

    // Preset 2: Words & Word Boundaries
    await expect(patternInput).toHaveValue('\\b[a-zA-Z]{4,}\\b');
    const textArea = page.locator('#test-text-area');
    await expect(textArea).toHaveValue(/The quick brown fox jumps over twelve lazy sleeping dogs/);

    // Click Next Pattern again -> Preset 3: Email-like Addresses
    await nextBtn.click();
    await expect(patternInput).toHaveValue('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');
  });

  test('Next Pattern button cycles through all 7 presets and wraps around to the beginning', async ({ page }) => {
    const patternInput = page.locator('#pattern-input');
    const nextBtn = page.getByRole('button', { name: /Load the next regex pattern/i });

    // Initial: Numbers
    await expect(patternInput).toHaveValue('\\b\\d+(?:\\.\\d+)?\\b');

    // Cycle through remaining 6 presets
    // 1 -> Words
    await nextBtn.click();
    await expect(patternInput).toHaveValue('\\b[a-zA-Z]{4,}\\b');

    // 2 -> Emails
    await nextBtn.click();
    await expect(patternInput).toHaveValue('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');

    // 3 -> URLs
    await nextBtn.click();
    await expect(patternInput).toHaveValue('https?:\\/\\/[a-zA-Z0-9.-]+(?:\\.[a-zA-Z]{2,})+(?:\\/[^\\s]*)?');

    // 4 -> ISO Dates
    await nextBtn.click();
    await expect(patternInput).toHaveValue('\\b(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})\\b');

    // 5 -> Server Log Parser
    await nextBtn.click();
    await expect(patternInput).toHaveValue('^\\[(?<level>INFO|WARN|ERROR)\\]\\s+(?<timestamp>\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+-\\s+(?<message>.*)$');

    // 6 -> Code Indentation / Whitespace
    await nextBtn.click();
    await expect(patternInput).toHaveValue('^[ ]{2,}');

    // 7th click wraps back to 0 -> Numbers
    await nextBtn.click();
    await expect(patternInput).toHaveValue('\\b\\d+(?:\\.\\d+)?\\b');
  });

  test('Next Pattern with Live enabled automatically evaluates matches for the new preset', async ({ page }) => {
    // Ensure Live is checked
    await expect(page.getByLabel(/Live evaluation/i)).toBeChecked();

    const nextBtn = page.getByRole('button', { name: /Load the next regex pattern/i });
    await nextBtn.click();

    // After debounce, matches should appear automatically
    await expect(page.getByText('Match #1', { exact: true })).toBeVisible();
    await expect(page.locator('mark.match-highlight', { hasText: 'quick' })).toBeVisible();
  });

  test('Next Pattern with Live disabled updates inputs without auto-running until Run is clicked', async ({ page }) => {
    // 1. Disable Live evaluation
    await page.getByLabel(/Live evaluation/i).uncheck();

    // 2. Click Next Pattern
    const nextBtn = page.getByRole('button', { name: /Load the next regex pattern/i });
    await nextBtn.click();

    // Inputs update
    const patternInput = page.locator('#pattern-input');
    await expect(patternInput).toHaveValue('\\b[a-zA-Z]{4,}\\b');

    // Matches should be cleared / idle (no match cards)
    await expect(page.getByText('Match #1', { exact: true })).not.toBeVisible();
    await expect(page.getByText('0 matches', { exact: true })).toBeVisible();

    // 3. User clicks Run
    await page.getByRole('button', { name: 'Run regular expression' }).click();

    // 4. Now matches appear with status feedback
    await expect(page.getByText('Match #1', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toBeVisible();
  });
});


/* global document */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs', 'screenshots');

fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Starting Vite server for screenshot capture...');
  const server = await createServer({
    configFile: path.join(rootDir, 'vite.config.ts'),
    root: rootDir,
    server: {
      host: '127.0.0.1',
      port: 5199,
    },
  });

  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address?.port ? address.port : 5199;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Vite server listening at ${baseUrl}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    // 1. Classic Lab with Highlighted Matches
    console.log('Capturing 01-classic-lab-matches.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto(baseUrl);
      await page.locator('#pattern-input').waitFor({ state: 'visible' });

      // Click Email-like Addresses preset
      await page.getByRole('button', { name: 'Email-like Addresses' }).click();
      await page.getByText('Match #1').waitFor({ state: 'visible' });
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(outDir, '01-classic-lab-matches.png'),
        fullPage: false,
      });
      await context.close();
    }

    // 2. Animated Replay Stage
    console.log('Capturing 02-animated-replay-stage.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto(baseUrl);
      await page.getByText('Match #1').waitFor({ state: 'visible' });

      // Switch to Replay
      await page.getByRole('tab', { name: /Animated Replay/i }).click();
      await page.getByText('Live Replay Canvas').waitFor({ state: 'visible' });

      // Advance replay step
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(400);

      await page.screenshot({
        path: path.join(outDir, '02-animated-replay-stage.png'),
        fullPage: false,
      });
      await context.close();
    }

    // 3. Find & Replace
    console.log('Capturing 03-find-and-replace.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto(baseUrl);
      await page.getByRole('button', { name: 'Toggle Find and Replace' }).click();
      await page.getByText('Find & Replace Engine').waitFor({ state: 'visible' });

      const patternInput = page.locator('#pattern-input');
      await patternInput.fill('(\\w+)\\s+costs\\s+\\$(\\d+)');

      const textArea = page.locator('#test-text-area');
      await textArea.fill('Gadget costs $45 and Tool costs $20.');

      const replaceInput = page.locator('#replace-template-input');
      await replaceInput.fill('[$1 is $2 USD]');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(outDir, '03-find-and-replace.png'),
        fullPage: false,
      });
      await context.close();
    }

    // 4. Regex Arcade Solved Case & Test Verification
    console.log('Capturing 04-regex-arcade-mission.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto(baseUrl);
      // Ensure clean storage so Mission 1 is solved fresh with full reward
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // Open Arcade
      await page.getByRole('tab', { name: /Regex Arcade/i }).click();
      await page.getByText('Regex Detective Arcade').waitFor({ state: 'visible' });

      // Solve mission 1
      const patternInput = page.locator('#mission-pattern-input');
      await patternInput.fill('\\d+');
      await page.getByRole('button', { name: 'Test Solution' }).click();
      await page.getByText(/Case Solved!/i).waitFor({ state: 'visible' });
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(outDir, '04-regex-arcade-mission.png'),
        fullPage: false,
      });
      await context.close();
    }

    // 5. Learning Handbook & Interactive Explainer
    console.log('Capturing 05-learning-handbook.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto(baseUrl);

      // Open Learn tab
      await page.getByRole('tab', { name: /Learn Regex/i }).click();
      await page.getByText('Regex Handbook & Token Explainer').waitFor({ state: 'visible' });
      await page.waitForTimeout(400);

      await page.screenshot({
        path: path.join(outDir, '05-learning-handbook.png'),
        fullPage: false,
      });
      await context.close();
    }

    // 6. Mascot & Achievements Collection
    console.log('Capturing 06-mascot-and-achievements.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      // Inject progress with unlocked achievements
      await page.addInitScript(() => {
        localStorage.setItem(
          'regexlab_progress_v1',
          JSON.stringify({
            version: 1,
            completedMissionIds: [
              'mission-1-number-scout',
              'mission-2-word-hunter',
              'mission-3-case-sleuth',
            ],
            hintsUsedByMission: {
              'mission-1-number-scout': 0,
              'mission-2-word-hunter': 1,
              'mission-3-case-sleuth': 0,
            },
            earnedXpEvents: [
              'mission-mission-1-number-scout',
              'mission-mission-2-word-hunter',
              'mission-mission-3-case-sleuth',
            ],
            totalXp: 150,
            unlockedAchievementIds: [
              'first-match',
              'capture-expert',
              'arcade-rookie',
              'detective-companion',
            ],
            lastActive: Date.now(),
          })
        );
      });
      await page.goto(baseUrl);
      await page.getByRole('tab', { name: /Regex Arcade/i }).click();
      await page.getByText('Regex Detective Arcade').waitFor({ state: 'visible' });
      await page.waitForTimeout(300);

      // Open the dedicated Detective Trophy Case modal
      await page.getByRole('button', { name: /Inspect Detective Badges/i }).click();
      await page.getByText('Detective Trophy Case').waitFor({ state: 'visible' });
      await page.waitForTimeout(400);

      await page.screenshot({
        path: path.join(outDir, '06-mascot-and-achievements.png'),
        fullPage: false,
      });
      await context.close();
    }

    // 7. Motion Effects & Progressive Animated Replay
    console.log('Capturing 07-motion-effects-enabled.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
        reducedMotion: 'no-preference',
      });
      try {
        const page = await context.newPage();

        // Ensure Motion Effects are explicitly enabled in isolated context
        await page.addInitScript(() => {
          localStorage.setItem('regexlab_reduced_motion', 'false');
        });

        // 1. Open app and wait for initial match results
        await page.goto(baseUrl);
        await page.getByText('Match #1').waitFor({ state: 'visible' });

        // 2. Verify header Motion Effects toggle has aria-pressed="true" and root has data-regexlab-motion="full"
        const motionToggle = page.getByTestId('motion-toggle');
        await motionToggle.waitFor({ state: 'visible' });
        const ariaPressed = await motionToggle.getAttribute('aria-pressed');
        if (ariaPressed !== 'true') {
          throw new Error(`Expected motion toggle aria-pressed to be "true", got "${ariaPressed}"`);
        }

        const rootMotionAttr = await page.evaluate(() =>
          document.documentElement.getAttribute('data-regexlab-motion')
        );
        if (rootMotionAttr !== 'full') {
          throw new Error(
            `Expected documentElement data-regexlab-motion to be "full", got "${rootMotionAttr}"`
          );
        }

        // 3. Open Animated Replay and wait for canvas
        await page.getByRole('tab', { name: /Animated Replay/i }).click();
        await page.getByText('Live Replay Canvas').waitFor({ state: 'visible' });

        // 4. Click Restart to begin progressive replay
        const restartBtn = page.getByRole('button', { name: 'Restart' });
        await restartBtn.waitFor({ state: 'visible' });
        await restartBtn.click();

        // 5. Wait for .replay-scanner-line element to become visible during active animation
        const scannerLine = page.locator('.replay-scanner-line');
        await scannerLine.waitFor({ state: 'visible', timeout: 5000 });

        // 6. Assert UI conditions before capture
        const isScannerVisible = await scannerLine.isVisible();
        if (!isScannerVisible) {
          throw new Error('Scanner line is not visible during active progressive replay.');
        }

        const isMotionToggleVisible = await motionToggle.isVisible();
        if (!isMotionToggleVisible) {
          throw new Error('Motion effects toggle is not visible in the header.');
        }

        const isControlsVisible = await restartBtn.isVisible();
        if (!isControlsVisible) {
          throw new Error('Replay controls are not visible.');
        }

        // Capture screenshot of live running replay with active scanner and motion toggle enabled
        await page.screenshot({
          path: path.join(outDir, '07-motion-effects-enabled.png'),
          fullPage: false,
        });
      } finally {
        await context.close();
      }
    }

    console.log('✓ All 7 screenshots captured successfully in docs/screenshots/');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

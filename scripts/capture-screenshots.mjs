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

    // 4. Regex Arcade Mission in Progress
    console.log('Capturing 04-regex-arcade-mission.png...');
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto(baseUrl);

      // Open Arcade
      await page.getByRole('tab', { name: /Regex Arcade/i }).click();
      await page.getByText('Regex Detective Arcade').waitFor({ state: 'visible' });

      // Solve mission 1
      const patternInput = page.locator('#mission-pattern-input');
      await patternInput.fill('\\d+');
      await page.getByRole('button', { name: 'Test Solution' }).click();
      await page.getByText(/Case Solved!/i).waitFor({ state: 'visible' });
      await page.waitForTimeout(400);

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
      await page.waitForTimeout(400);

      await page.screenshot({
        path: path.join(outDir, '06-mascot-and-achievements.png'),
        fullPage: false,
      });
      await context.close();
    }

    console.log('✓ All 6 screenshots captured successfully in docs/screenshots/');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

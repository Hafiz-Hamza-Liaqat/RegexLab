import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../../src/App.tsx';
import { defaultWorkerManager } from '../../src/lib/regex/workerManager.ts';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders header with product name, tagline, and navigation tabs', () => {
    render(<App />);

    expect(screen.getAllByText('RegexLab')[0]).toBeInTheDocument();
    expect(screen.getByText('Test. Animate. Master.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Classic Lab/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Animated Replay/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Regex Arcade/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Learn Regex/i })).toBeInTheDocument();
  });

  it('renders Pattern Editor with flag toggles and test text editor', () => {
    render(<App />);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z\]\\d\{3\}/i);
    expect(patternInput).toBeInTheDocument();

    const gFlagBtn = screen.getByRole('button', { name: /Global flag/i });
    expect(gFlagBtn).toBeInTheDocument();

    const testTextArea = screen.getByPlaceholderText(/Paste or write your test text here/i);
    expect(testTextArea).toBeInTheDocument();
  });

  it('allows toggling regex flags', async () => {
    render(<App />);

    const iFlagBtn = screen.getByRole('button', { name: /Ignore Case flag/i });
    expect(iFlagBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(iFlagBtn);
    expect(iFlagBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('loads preset when selected', async () => {
    render(<App />);

    const emailsPresetBtn = screen.getByRole('button', { name: /Email-like Addresses/i });
    fireEvent.click(emailsPresetBtn);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z\]\\d\{3\}/i);
    expect(patternInput).toHaveValue('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');
  });

  it('switches views between Classic Lab, Animated Replay, Arcade, and Learn', async () => {
    render(<App />);

    // Switch to Animated Replay
    const replayTab = screen.getByRole('tab', { name: /Animated Replay/i });
    fireEvent.click(replayTab);
    expect(screen.getByText(/Live Replay Canvas/i)).toBeInTheDocument();

    // Switch to Arcade
    const arcadeTab = screen.getByRole('tab', { name: /Regex Arcade/i });
    fireEvent.click(arcadeTab);
    expect(screen.getByText(/Regex Detective Arcade/i)).toBeInTheDocument();
    expect(screen.getByText(/Mission Dossiers/i)).toBeInTheDocument();

    // Switch to Learn
    const learnTab = screen.getByRole('tab', { name: /Learn Regex/i });
    fireEvent.click(learnTab);
    expect(screen.getByText(/Regex Handbook & Token Explainer/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Token Explainer/i)).toBeInTheDocument();

    // Switch back to Classic Lab
    const classicTab = screen.getByRole('tab', { name: /Classic Lab/i });
    fireEvent.click(classicTab);
    expect(screen.getByText(/Regular Expression Pattern/i)).toBeInTheDocument();
  });

  it('toggles Find & Replace panel', async () => {
    render(<App />);

    const replaceBtn = screen.getByRole('button', { name: 'Toggle Find and Replace' });
    fireEvent.click(replaceBtn);

    expect(screen.getByText(/Find & Replace Engine/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. \[\$1\]/i)).toBeInTheDocument();
  });

  it('toggles theme between dark and light', () => {
    render(<App />);

    const themeBtn = screen.getByLabelText(/Switch to light mode/i);
    fireEvent.click(themeBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    const darkBtn = screen.getByLabelText(/Switch to dark mode/i);
    fireEvent.click(darkBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles motion effects and updates aria-pressed and data-regexlab-motion attribute', () => {
    render(<App />);

    const motionBtn = screen.getByTestId('motion-toggle');
    expect(motionBtn).toBeInTheDocument();
    expect(motionBtn).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');

    fireEvent.click(motionBtn);

    expect(motionBtn).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');
    expect(localStorage.getItem('regexlab_reduced_motion')).toBe('true');

    fireEvent.click(motionBtn);

    expect(motionBtn).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
    expect(localStorage.getItem('regexlab_reduced_motion')).toBe('false');
  });

  it('prevents an older in-flight result from overwriting state after Next Pattern is clicked with Live evaluation disabled, clears replacement preview, and subsequent manual Run works', async () => {
    render(<App />);

    // 1. Disable Live evaluation
    const liveCheckbox = screen.getByLabelText(/Live evaluation/i);
    fireEvent.click(liveCheckbox);
    expect(liveCheckbox).not.toBeChecked();

    // 2. Open Find & Replace and enter replacement template
    const toggleReplaceBtn = screen.getByRole('button', { name: 'Toggle Find and Replace' });
    fireEvent.click(toggleReplaceBtn);
    const replaceInput = screen.getByPlaceholderText(/e\.g\. \[\$1\]/i);
    fireEvent.change(replaceInput, { target: { value: '[$&]' } });

    // 3. Spy on defaultWorkerManager.runMatch and runReplace to create a controllable in-flight request
    let resolveStaleMatch: ((val: unknown) => void) | null = null;
    let resolveStaleReplace: ((val: unknown) => void) | null = null;
    let matchCallCount = 0;
    let replaceCallCount = 0;

    const origRunMatch = defaultWorkerManager.runMatch.bind(defaultWorkerManager);
    const origRunReplace = defaultWorkerManager.runReplace.bind(defaultWorkerManager);

    vi.spyOn(defaultWorkerManager, 'runMatch').mockImplementation(async (req) => {
      matchCallCount++;
      if (matchCallCount === 1) {
        // Hold first request in flight indefinitely until we manually resolve it
        return new Promise((resolve) => {
          resolveStaleMatch = resolve;
        });
      }
      return origRunMatch(req);
    });

    vi.spyOn(defaultWorkerManager, 'runReplace').mockImplementation(async (req) => {
      replaceCallCount++;
      if (replaceCallCount === 1) {
        // Hold first replacement in flight
        return new Promise((resolve) => {
          resolveStaleReplace = resolve;
        });
      }
      return origRunReplace(req);
    });

    // 4. Click Run to start the in-flight requests for Preset 1 (Numbers)
    const runBtn = screen.getByRole('button', { name: 'Run regular expression' });
    fireEvent.click(runBtn);

    expect(matchCallCount).toBe(1);
    expect(replaceCallCount).toBe(1);

    // 5. While the requests are in-flight, click Next Pattern
    const nextBtn = screen.getByRole('button', { name: /Load the next regex pattern/i });
    fireEvent.click(nextBtn);

    // Verify pattern and sample text updated to Preset 2 (Words)
    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z\]\\d\{3\}/i);
    expect(patternInput).toHaveValue('\\b[a-zA-Z]{4,}\\b');

    // Verify match cards are empty / idle
    expect(screen.queryByText('Match #1')).not.toBeInTheDocument();
    expect(screen.getByText('0 matches')).toBeInTheDocument();

    // Verify replacement preview is cleared / reset to placeholder
    expect(screen.getByText('Enter a pattern to preview replacement.')).toBeInTheDocument();
    expect(screen.getByText('0 replacements')).toBeInTheDocument();

    // 6. Now, resolve the delayed first match and replace requests with stale results from Preset 1
    resolveStaleMatch?.({
      id: 'stale-match-id',
      status: 'success',
      matches: [
        {
          index: 1,
          value: '12',
          start: 5,
          end: 7,
          groups: [],
          inputContext: { prefix: 'Room ', suffix: ', floor' },
        },
      ],
      totalMatches: 1,
      executionTimeMs: 10,
    });

    resolveStaleReplace?.({
      id: 'stale-replace-id',
      status: 'success',
      resultText: 'Room [12], floor [4]...',
      replacementCount: 2,
      executionTimeMs: 10,
    });

    // Wait a tick to allow any resolved promises to flush
    await new Promise((r) => setTimeout(r, 50));

    // Stale result MUST NOT overwrite the state:
    // Pattern is still Preset 2
    expect(patternInput).toHaveValue('\\b[a-zA-Z]{4,}\\b');
    // Match results remain 0 matches and no Match #1
    expect(screen.queryByText('Match #1')).not.toBeInTheDocument();
    expect(screen.getByText('0 matches')).toBeInTheDocument();
    // Replacement preview remains cleared / placeholder
    expect(screen.getByText('Enter a pattern to preview replacement.')).toBeInTheDocument();
    expect(screen.getByText('0 replacements')).toBeInTheDocument();
    expect(screen.queryByText(/Room \[12\]/)).not.toBeInTheDocument();

    // 7. Click Run manually to evaluate the staged Preset 2
    fireEvent.click(runBtn);

    // Verify that the new execution succeeds and displays matches for Preset 2
    await waitFor(() => {
      expect(screen.getByText('Match #1')).toBeInTheDocument();
    });
    expect(screen.getAllByText('quick').length).toBeGreaterThanOrEqual(1);

    // Verify replacement preview now appears for Preset 2
    await waitFor(() => {
      expect(screen.queryByText('Enter a pattern to preview replacement.')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText('Replaced output preview')).toHaveTextContent(/\[quick\]/);
  });
});


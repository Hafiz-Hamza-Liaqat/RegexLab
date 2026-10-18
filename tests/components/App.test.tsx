import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from '../../src/App.tsx';

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
});

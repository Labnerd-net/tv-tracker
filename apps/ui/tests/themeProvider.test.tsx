import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '../src/contexts/theme/ThemeProvider';
import { useTheme } from '../src/contexts/theme/ThemeContext';

function ThemeConsumer() {
  const { mode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid='mode'>{mode}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initialises to dark when localStorage has no stored value', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('initialises to light when localStorage contains light', () => {
    localStorage.setItem('themeMode', 'light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('initialises to dark when localStorage contains dark', () => {
    localStorage.setItem('themeMode', 'dark');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('falls back to dark when localStorage contains an unrecognised value', () => {
    localStorage.setItem('themeMode', 'system');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('toggleTheme switches from dark to light', async () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { screen.getByRole('button').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('toggleTheme switches from light to dark', async () => {
    localStorage.setItem('themeMode', 'light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { screen.getByRole('button').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('writes the new mode to localStorage after toggle', async () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { screen.getByRole('button').click(); });
    expect(localStorage.getItem('themeMode')).toBe('light');
  });
});

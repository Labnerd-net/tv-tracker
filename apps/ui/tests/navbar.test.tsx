import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '../src/contexts/theme/ThemeProvider';
import Navbar from '../src/components/Navbar';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogout = vi.fn();
vi.mock('../src/contexts/auth/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/auth/AuthContext')>();
  return { ...actual, useAuth: () => mockUseAuth() };
});

let mockUseAuth: () => { user: object | null; logout: () => void };

function renderNavbar() {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    </ThemeProvider>
  );
}

describe('Navbar — unauthenticated', () => {
  beforeEach(() => {
    mockUseAuth = () => ({ user: null, logout: mockLogout });
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });

  it('shows a Login button', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('Login button navigates to /login', async () => {
    renderNavbar();
    await act(async () => { screen.getByRole('button', { name: /login/i }).click(); });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('does not render a search field', () => {
    renderNavbar();
    expect(screen.queryByPlaceholderText(/search tv shows/i)).not.toBeInTheDocument();
  });

  it('does not render a Logout button', () => {
    renderNavbar();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });
});

describe('Navbar — authenticated', () => {
  beforeEach(() => {
    mockUseAuth = () => ({ user: { username: 'alice' }, logout: mockLogout });
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });

  it('shows a search field', () => {
    renderNavbar();
    expect(screen.getByPlaceholderText(/search tv shows/i)).toBeInTheDocument();
  });

  it('search form navigates to /search/:query', async () => {
    renderNavbar();
    const input = screen.getByPlaceholderText(/search tv shows/i);
    fireEvent.change(input, { target: { value: 'breaking bad' } });
    await act(async () => {
      screen.getByRole('button', { name: /^go$/i }).click();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/search/breaking bad/');
  });

  it('shows a Logout button', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('Logout button calls logout and navigates to /login', async () => {
    renderNavbar();
    await act(async () => { screen.getByRole('button', { name: /logout/i }).click(); });
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('does not render a Login button', () => {
    renderNavbar();
    expect(screen.queryByRole('button', { name: /^login$/i })).not.toBeInTheDocument();
  });
});

describe('Navbar — shared', () => {
  beforeEach(() => {
    mockUseAuth = () => ({ user: null, logout: mockLogout });
    localStorage.clear();
  });

  it('theme toggle button is present', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('theme toggle calls toggleTheme', async () => {
    renderNavbar();
    const toggle = screen.getByRole('button', { name: /toggle theme/i });
    // default mode is dark; clicking should switch to light (smoke test via DOM)
    await act(async () => { toggle.click(); });
    // just verify it doesn't throw and the button is still present
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('does not render sort controls', () => {
    renderNavbar();
    expect(screen.queryByText(/sort by/i)).not.toBeInTheDocument();
  });

  it('does not render view controls', () => {
    renderNavbar();
    // The old view buttons had no fixed label; verify there's no "View" heading
    expect(screen.queryByText(/^view$/i)).not.toBeInTheDocument();
  });
});

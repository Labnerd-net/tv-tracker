import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '../src/contexts/theme/ThemeProvider';
import OneShow from '../src/pages/OneShow';
import { makeShow } from './testUtils';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ showID: '42' }),
  };
});

vi.mock('../src/contexts/show/ShowContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/show/ShowContext')>();
  return {
    ...actual,
    useShow: () => mockUseShow(),
  };
});

vi.mock('../src/hooks/useShowActions', () => ({
  useShowActions: () => ({ actionLoading: {}, refreshShow: vi.fn(), deleteShow: vi.fn() }),
}));

// OneShow reads its show from ShowContext (populated by the dashboard), not from an API call.
let mockUseShow: () => { tvShows: ReturnType<typeof makeShow>[]; loading: boolean };

function renderOneShow() {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <OneShow />
      </BrowserRouter>
    </ThemeProvider>
  );
}

describe('OneShow — loading state', () => {
  beforeEach(() => {
    mockUseShow = () => ({ tvShows: [], loading: true });
  });

  it('does not show show title or error text while loading', () => {
    renderOneShow();

    expect(screen.queryByText('Test Show')).not.toBeInTheDocument();
    expect(screen.queryByText(/show not found/i)).not.toBeInTheDocument();
  });
});

describe('OneShow — detail view', () => {
  beforeEach(() => {
    const show = makeShow({ showId: 42, title: 'Breaking Bad', platform: 'AMC', status: 'Ended' });
    mockUseShow = () => ({ tvShows: [show], loading: false });
  });

  it('renders the show title', () => {
    renderOneShow();

    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
  });

  it('renders platform and status metadata', () => {
    renderOneShow();

    // Platform and status are joined as "AMC · Ended" in the subtitle line
    expect(screen.getByText('AMC · Ended')).toBeInTheDocument();
  });
});

describe('OneShow — not found state', () => {
  it('shows "Show not found" when there are no shows', () => {
    mockUseShow = () => ({ tvShows: [], loading: false });
    renderOneShow();

    expect(screen.getByText(/show not found/i)).toBeInTheDocument();
  });

  it('shows "Show not found" when the id is not in the list', () => {
    const other = makeShow({ showId: 7, title: 'Other Show' });
    mockUseShow = () => ({ tvShows: [other], loading: false });
    renderOneShow();

    expect(screen.getByText(/show not found/i)).toBeInTheDocument();
    expect(screen.queryByText('Other Show')).not.toBeInTheDocument();
  });

  it('does not render a show heading', () => {
    mockUseShow = () => ({ tvShows: [], loading: false });
    renderOneShow();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

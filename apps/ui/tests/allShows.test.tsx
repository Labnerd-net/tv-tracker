import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '../src/contexts/theme/ThemeProvider';
import AllShows from '../src/pages/AllShows';
import { makeShow } from './testUtils';

vi.mock('../src/contexts/show/ShowContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/show/ShowContext')>();
  return {
    ...actual,
    useShow: () => mockUseShow(),
  };
});

vi.mock('../src/hooks/useShowActions', () => ({
  useShowActions: () => ({ loading: false, refreshShow: vi.fn(), deleteShow: vi.fn() }),
}));

let mockUseShow: () => { tvShows: ReturnType<typeof makeShow>[]; loading: boolean; addShow: () => void; updateShow: () => void; removeShow: () => void };

function renderAllShows() {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <AllShows />
      </BrowserRouter>
    </ThemeProvider>
  );
}

describe('AllShows — loading state', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseShow = () => ({
      tvShows: [],
      loading: true,
      addShow: vi.fn(),
      updateShow: vi.fn(),
      removeShow: vi.fn(),
    });
  });

  it('does not show empty state text while loading', () => {
    renderAllShows();
    expect(screen.queryByText(/no shows tracked yet/i)).not.toBeInTheDocument();
  });

  it('does not show show count while loading', () => {
    renderAllShows();
    // Count label only renders when !loading && tvShows.length > 0
    expect(screen.queryByText(/show/i)).not.toBeInTheDocument();
  });
});

describe('AllShows — populated state', () => {
  const show1 = makeShow({ showId: 1, title: 'Breaking Bad', tvMazeId: 1 });
  const show2 = makeShow({ showId: 2, title: 'Arrested Development', tvMazeId: 2 });

  beforeEach(() => {
    localStorage.clear();
    mockUseShow = () => ({
      tvShows: [show1, show2],
      loading: false,
      addShow: vi.fn(),
      updateShow: vi.fn(),
      removeShow: vi.fn(),
    });
  });

  it('renders show titles in card view', () => {
    renderAllShows();
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('Arrested Development')).toBeInTheDocument();
  });

  it('renders the show count', () => {
    renderAllShows();
    expect(screen.getByText('2 shows')).toBeInTheDocument();
  });

  it('does not show empty state text', () => {
    renderAllShows();
    expect(screen.queryByText(/no shows tracked yet/i)).not.toBeInTheDocument();
  });
});

describe('AllShows — empty state', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseShow = () => ({
      tvShows: [],
      loading: false,
      addShow: vi.fn(),
      updateShow: vi.fn(),
      removeShow: vi.fn(),
    });
  });

  it('shows the empty state message', () => {
    renderAllShows();
    expect(screen.getByText(/no shows tracked yet/i)).toBeInTheDocument();
  });

  it('shows the search prompt', () => {
    renderAllShows();
    expect(screen.getByText(/use search to find and add shows/i)).toBeInTheDocument();
  });
});

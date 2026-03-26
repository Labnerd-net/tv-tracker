import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '../src/contexts/theme/ThemeProvider';
import SearchResults from '../src/pages/SearchResults';
import { makeTvMazeSeries, makeTvMazeShow } from './testUtils';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ showName: 'breaking bad' }),
  };
});

vi.mock('../src/apis/userRequests');

vi.mock('../src/contexts/alert/AlertContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/alert/AlertContext')>();
  return {
    ...actual,
    useAlert: () => ({
      visibleAlert: false,
      alertVariant: '',
      alertMessage: '',
      showAlert: vi.fn(),
    }),
  };
});

vi.mock('../src/contexts/show/ShowContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/show/ShowContext')>();
  return {
    ...actual,
    useShow: () => ({
      tvShows: [],
      loading: false,
      addShow: vi.fn(),
      updateShow: vi.fn(),
      removeShow: vi.fn(),
    }),
  };
});

import * as Api from '../src/apis/userRequests';

function renderSearchResults() {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <SearchResults />
      </BrowserRouter>
    </ThemeProvider>
  );
}

describe('SearchResults — loading state', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a loading spinner while fetching', async () => {
    // Resolve with empty data after the synchronous render so the worker can exit cleanly
    let resolve!: (v: unknown) => void;
    vi.mocked(Api.tvShowResults).mockImplementation(() => new Promise(r => { resolve = r; }));
    renderSearchResults();
    // Initial render: loading=true, CircularProgress visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Let the effect settle
    await act(async () => { resolve({ success: true, data: [] }); });
  });

  it('does not show results or empty state while loading', async () => {
    let resolve!: (v: unknown) => void;
    vi.mocked(Api.tvShowResults).mockImplementation(() => new Promise(r => { resolve = r; }));
    renderSearchResults();
    expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    await act(async () => { resolve({ success: true, data: [] }); });
  });
});

describe('SearchResults — results rendered', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders result show names after fetch resolves', async () => {
    const series = makeTvMazeSeries({ show: makeTvMazeShow({ id: 1, name: 'Breaking Bad' }) });
    vi.mocked(Api.tvShowResults).mockResolvedValue({ success: true, data: [series] });
    vi.mocked(Api.fetchNextEpisodeDate).mockResolvedValue({ success: true, data: { date: '2025-06-01' } });

    await act(async () => {
      renderSearchResults();
    });

    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
  });

  it('renders multiple results', async () => {
    const series1 = makeTvMazeSeries({ show: makeTvMazeShow({ id: 1, name: 'Breaking Bad' }) });
    const series2 = makeTvMazeSeries({ show: makeTvMazeShow({ id: 2, name: 'Better Call Saul' }) });
    vi.mocked(Api.tvShowResults).mockResolvedValue({ success: true, data: [series1, series2] });
    vi.mocked(Api.fetchNextEpisodeDate).mockResolvedValue({ success: true, data: { date: '' } });

    await act(async () => {
      renderSearchResults();
    });

    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
  });
});

describe('SearchResults — empty results', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows "No results found" when search returns empty array', async () => {
    vi.mocked(Api.tvShowResults).mockResolvedValue({ success: true, data: [] });

    await act(async () => {
      renderSearchResults();
    });

    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('does not show a loading spinner after empty results resolve', async () => {
    vi.mocked(Api.tvShowResults).mockResolvedValue({ success: true, data: [] });

    await act(async () => {
      renderSearchResults();
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('SearchResults — abort on unmount', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls abort when component unmounts during fetch', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    let resolve!: (v: unknown) => void;
    vi.mocked(Api.tvShowResults).mockImplementation(() => new Promise(r => { resolve = r; }));

    const { unmount } = renderSearchResults();
    unmount(); // triggers useEffect cleanup → controller.abort()

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
    // Resolve to let the promise settle so the worker can exit cleanly
    resolve({ success: true, data: [] });
  });
});

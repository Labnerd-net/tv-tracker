import { render, screen, act } from '@testing-library/react';
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

vi.mock('../src/hooks/useShowActions', () => ({
  useShowActions: () => ({ loading: false, refreshShow: vi.fn(), deleteShow: vi.fn() }),
}));

import * as Api from '../src/apis/userRequests';

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
    vi.resetAllMocks();
  });

  it('does not show show title or error text while fetching', async () => {
    // getOneShow never resolves — component stays in loading state
    vi.mocked(Api.getOneShow).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      renderOneShow();
    });

    expect(screen.queryByText('Test Show')).not.toBeInTheDocument();
    expect(screen.queryByText(/show not found/i)).not.toBeInTheDocument();
  });
});

describe('OneShow — detail view', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the show title when fetch succeeds', async () => {
    const show = makeShow({ showId: 42, title: 'Breaking Bad', platform: 'AMC', status: 'Ended' });
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: true, data: show });

    await act(async () => {
      renderOneShow();
    });

    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
  });

  it('renders platform and status metadata', async () => {
    const show = makeShow({ showId: 42, title: 'Breaking Bad', platform: 'AMC', status: 'Ended' });
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: true, data: show });

    await act(async () => {
      renderOneShow();
    });

    // Platform and status are joined as "AMC · Ended" in the subtitle line
    expect(screen.getByText('AMC · Ended')).toBeInTheDocument();
  });
});

describe('OneShow — error state', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows "Show not found" when getOneShow returns failure', async () => {
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: false, error: 'Not found' });

    await act(async () => {
      renderOneShow();
    });

    expect(screen.getByText(/show not found/i)).toBeInTheDocument();
  });

  it('does not render the show title in error state', async () => {
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: false, error: 'Not found' });

    await act(async () => {
      renderOneShow();
    });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

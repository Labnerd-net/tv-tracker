import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useShow } from '../src/contexts/show/ShowContext';
import { ShowProvider } from '../src/contexts/show/ShowProvider';
import { makeShow } from './testUtils';

const mockShowAlert = vi.fn();

vi.mock('../src/contexts/auth/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/auth/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({ user: null, isLoading: false }),
  };
});

vi.mock('../src/contexts/alert/AlertContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/alert/AlertContext')>();
  return {
    ...actual,
    useAlert: () => ({
      visibleAlert: false,
      alertVariant: '',
      alertMessage: '',
      showAlert: mockShowAlert,
    }),
  };
});

vi.mock('../src/apis/userRequests');

import * as Api from '../src/apis/userRequests';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(ShowProvider, null, children)
);

describe('ShowProvider — refreshShow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(Api.getAllShows).mockResolvedValue({ success: false, error: 'none' });
  });

  it('calls API and shows success alert on success', async () => {
    const show = makeShow({ showId: 1, title: 'Breaking Bad' });
    vi.mocked(Api.updateShow).mockResolvedValue({ success: true, data: { status: 'ok' } });
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: true, data: show });

    const { result } = renderHook(() => useShow(), { wrapper });
    await act(async () => {
      await result.current.refreshShow('1', 'Breaking Bad');
    });

    expect(Api.updateShow).toHaveBeenCalledWith('1');
    expect(Api.getOneShow).toHaveBeenCalledWith('1');
    expect(mockShowAlert).toHaveBeenCalledWith('success', expect.stringContaining('Breaking Bad'));
  });

  it('shows error alert and does not call getOneShow when updateShow returns failure', async () => {
    vi.mocked(Api.updateShow).mockResolvedValue({ success: false, error: 'Server error' });

    const { result } = renderHook(() => useShow(), { wrapper });
    await act(async () => {
      await result.current.refreshShow('1', 'Breaking Bad');
    });

    expect(Api.getOneShow).not.toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith('danger', expect.any(String));
  });

  it('shows error alert and does not call getOneShow when updateShow throws', async () => {
    vi.mocked(Api.updateShow).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useShow(), { wrapper });
    await act(async () => {
      await result.current.refreshShow('1', 'Breaking Bad');
    });

    expect(Api.getOneShow).not.toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith('danger', expect.any(String));
  });

  it('shows error alert when getOneShow fails', async () => {
    vi.mocked(Api.updateShow).mockResolvedValue({ success: true, data: { status: 'ok' } });
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: false, error: 'Not found' });

    const { result } = renderHook(() => useShow(), { wrapper });
    await act(async () => {
      await result.current.refreshShow('1', 'Breaking Bad');
    });

    expect(mockShowAlert).toHaveBeenCalledWith('danger', expect.any(String));
  });

  it('tracks per-show loading state independently during concurrent calls', async () => {
    let resolveShow1!: (v: unknown) => void;
    let resolveShow2!: (v: unknown) => void;
    vi.mocked(Api.updateShow).mockResolvedValue({ success: true, data: { status: 'ok' } });
    vi.mocked(Api.getOneShow)
      .mockReturnValueOnce(new Promise(res => { resolveShow1 = res; }))
      .mockReturnValueOnce(new Promise(res => { resolveShow2 = res; }));

    const { result } = renderHook(() => useShow(), { wrapper });

    act(() => {
      result.current.refreshShow('1', 'Show A');
      result.current.refreshShow('2', 'Show B');
    });

    // Both should be loading simultaneously
    await vi.waitFor(() => {
      expect(result.current.actionLoading[1]).toBe(true);
      expect(result.current.actionLoading[2]).toBe(true);
    });

    // Resolve show 1 — show 2 must still be loading
    await act(async () => {
      resolveShow1({ success: true, data: makeShow({ showId: 1 }) });
    });
    expect(result.current.actionLoading[1]).toBe(false);
    expect(result.current.actionLoading[2]).toBe(true);

    // Resolve show 2
    await act(async () => {
      resolveShow2({ success: true, data: makeShow({ showId: 2 }) });
    });
    expect(result.current.actionLoading[2]).toBe(false);
  });
});

describe('ShowProvider — deleteShow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(Api.getAllShows).mockResolvedValue({ success: false, error: 'none' });
  });

  it('removes the show from context and shows success alert on success', async () => {
    vi.mocked(Api.deleteShow).mockResolvedValue({ success: true, data: { status: 'ok' } });

    const { result } = renderHook(() => useShow(), { wrapper });

    await act(async () => { result.current.addShow(makeShow({ showId: 1, title: 'Breaking Bad' })); });
    expect(result.current.tvShows).toHaveLength(1);

    await act(async () => {
      await result.current.deleteShow('1', 'Breaking Bad');
    });

    expect(result.current.tvShows).toHaveLength(0);
    expect(mockShowAlert).toHaveBeenCalledWith('success', expect.stringContaining('Breaking Bad'));
  });

  it('does NOT remove the show from context and shows error alert on failure', async () => {
    vi.mocked(Api.deleteShow).mockResolvedValue({ success: false, error: 'Server error' });

    const { result } = renderHook(() => useShow(), { wrapper });

    await act(async () => { result.current.addShow(makeShow({ showId: 1, title: 'Breaking Bad' })); });
    expect(result.current.tvShows).toHaveLength(1);

    await act(async () => {
      await result.current.deleteShow('1', 'Breaking Bad');
    });

    expect(result.current.tvShows).toHaveLength(1);
    expect(mockShowAlert).toHaveBeenCalledWith('danger', expect.any(String));
  });
});

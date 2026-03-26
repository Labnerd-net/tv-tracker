import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShowActions } from '../src/hooks/useShowActions';
import { makeShow } from './testUtils';

const mockUpdateShowCtx = vi.fn();
const mockRemoveShow = vi.fn();
const mockShowAlert = vi.fn();

vi.mock('../src/contexts/show/ShowContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/contexts/show/ShowContext')>();
  return {
    ...actual,
    useShow: () => ({
      tvShows: [],
      loading: false,
      addShow: vi.fn(),
      updateShow: mockUpdateShowCtx,
      removeShow: mockRemoveShow,
    }),
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

describe('useShowActions — refreshShow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls context updateShow and shows success alert on success', async () => {
    const show = makeShow({ showId: 1, title: 'Breaking Bad' });
    vi.mocked(Api.updateShow).mockResolvedValue({ success: true, data: { status: 'ok' } });
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: true, data: show });

    const { result } = renderHook(() => useShowActions());
    await act(async () => {
      await result.current.refreshShow('1', 'Breaking Bad');
    });

    expect(mockUpdateShowCtx).toHaveBeenCalledWith(show);
    expect(mockShowAlert).toHaveBeenCalledWith('success', expect.stringContaining('Breaking Bad'));
  });

  it('does NOT call context updateShow and shows error alert when getOneShow fails', async () => {
    vi.mocked(Api.updateShow).mockResolvedValue({ success: true, data: { status: 'ok' } });
    vi.mocked(Api.getOneShow).mockResolvedValue({ success: false, error: 'Not found' });

    const { result } = renderHook(() => useShowActions());
    await act(async () => {
      await result.current.refreshShow('1', 'Breaking Bad');
    });

    expect(mockUpdateShowCtx).not.toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith('danger', expect.any(String));
  });

  it('handles concurrent refreshShow calls without errors', async () => {
    const show1 = makeShow({ showId: 1, title: 'Show A' });
    const show2 = makeShow({ showId: 2, title: 'Show B' });
    vi.mocked(Api.updateShow).mockResolvedValue({ success: true, data: { status: 'ok' } });
    vi.mocked(Api.getOneShow)
      .mockResolvedValueOnce({ success: true, data: show1 })
      .mockResolvedValueOnce({ success: true, data: show2 });

    const { result } = renderHook(() => useShowActions());
    await act(async () => {
      await Promise.all([
        result.current.refreshShow('1', 'Show A'),
        result.current.refreshShow('2', 'Show B'),
      ]);
    });

    expect(mockUpdateShowCtx).toHaveBeenCalledTimes(2);
  });
});

describe('useShowActions — deleteShow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls context removeShow and shows success alert on success', async () => {
    vi.mocked(Api.deleteShow).mockResolvedValue({ success: true, data: { status: 'ok' } });

    const { result } = renderHook(() => useShowActions());
    await act(async () => {
      await result.current.deleteShow('1', 'Breaking Bad');
    });

    expect(mockRemoveShow).toHaveBeenCalledWith(1);
    expect(mockShowAlert).toHaveBeenCalledWith('success', expect.stringContaining('Breaking Bad'));
  });

  it('does NOT call context removeShow and shows error alert on failure', async () => {
    vi.mocked(Api.deleteShow).mockResolvedValue({ success: false, error: 'Server error' });

    const { result } = renderHook(() => useShowActions());
    await act(async () => {
      await result.current.deleteShow('1', 'Breaking Bad');
    });

    expect(mockRemoveShow).not.toHaveBeenCalled();
    expect(mockShowAlert).toHaveBeenCalledWith('danger', expect.any(String));
  });
});

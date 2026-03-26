import axios from 'axios';
import type { TvMazeSeries, TvMazeShow } from '@shared/types/tvmaze';
import type { ApiResponse, ProfileData, ShowData } from '@shared/types/tv-tracker';
import { TV_MAZE_API_BASE } from '@shared/constants/tvmaze';
import { apiClient, handleApiError } from '../utils/requests';
const path = 'api/user';

export async function getUserProfile(): Promise<ApiResponse<ProfileData>> {
  try {
    const response = await apiClient.get(`/${path}/profile`);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getUserProfile', error);
  }
}

export async function getAllShows(): Promise<ApiResponse<ShowData[]>> {
  try {
    const response = await apiClient.get(`/${path}/tvshows`);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getAllShows', error);
  }
}

export async function getOneShow(showID: string): Promise<ApiResponse<ShowData>> {
  try {
    const response = await apiClient.get(`/${path}/tvshow/${showID}`);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getOneShow', error);
  }
}

export async function addNewShowJson(showData: TvMazeShow): Promise<ApiResponse<{ status: string; showId?: number }>> {
  try {
    const response = await apiClient.post(`/${path}/tvshow`, showData);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('addNewShowJson', error);
  }
}

export async function updateShow(showID: string): Promise<ApiResponse<{ status: string; showId?: number }>> {
  try {
    const response = await apiClient.patch(`/${path}/tvshow/${showID}`, null);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('updateShow', error);
  }
}

export async function deleteShow(showID: string): Promise<ApiResponse<{ status: string; showId?: number }>> {
  try {
    const response = await apiClient.delete(`/${path}/tvshow/${showID}`);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('deleteShow', error);
  }
}

export async function fetchNextEpisodeDate(searchData: TvMazeShow, signal?: AbortSignal): Promise<ApiResponse<{ date: string }>> {
  try {
    if (searchData._links.nextepisode) {
      const href = searchData._links.nextepisode.href;
      try {
        if (new URL(href).hostname !== 'api.tvmaze.com') {
          return { success: false, error: 'Invalid episode link hostname' };
        }
      } catch {
        return { success: false, error: 'Invalid episode link URL' };
      }
      const response = await axios.get(href, { signal });
      if (response.data?.airdate) {
        return { success: true, data: { date: new Date(response.data.airdate).toDateString() } };
      }
      return { success: false, error: 'No airdate in episode response' };
    }
    return { success: false, error: 'No Next Episode' };
  } catch (error) {
    return handleApiError('fetchNextEpisodeDate', error);
  }
}

export async function fetchPrevEpisodeDate(searchData: TvMazeShow, signal?: AbortSignal): Promise<ApiResponse<{ date: string }>> {
  try {
    if (searchData._links.previousepisode) {
      const href = searchData._links.previousepisode.href;
      try {
        if (new URL(href).hostname !== 'api.tvmaze.com') {
          return { success: false, error: 'Invalid episode link hostname' };
        }
      } catch {
        return { success: false, error: 'Invalid episode link URL' };
      }
      const response = await axios.get(href, { signal });
      if (response.data?.airdate) {
        return { success: true, data: { date: new Date(response.data.airdate).toDateString() } };
      }
      return { success: false, error: 'No airdate in episode response' };
    }
    return { success: false, error: 'No Previous Episode' };
  } catch (error) {
    return handleApiError('fetchPrevEpisodeDate', error);
  }
}

export async function tvShowResults(showName: string): Promise<ApiResponse<TvMazeSeries[]>> {
  try {
    const response = await axios.get(`${TV_MAZE_API_BASE}/search/shows?q=${encodeURIComponent(showName)}`)
    return { success: true, data: response.data };
  } catch(error) {
    return handleApiError('tvShowResults', error);
  }
}

export async function returnSearchShow(showId: string): Promise<ApiResponse<TvMazeShow>> {
  try {
    const response = await axios.get(`${TV_MAZE_API_BASE}/shows/${showId}`)
    return { success: true, data: response.data };
  } catch(error) {
    return handleApiError('returnSearchShow', error);
  }
}

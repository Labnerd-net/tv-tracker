import axios from 'axios';
import type { TvMazeSeries, TvMazeShow } from '@shared/types/tvmaze';
import type { ApiResponse, ProfileData, ShowData } from '@shared/types/tv-tracker';
import { TV_MAZE_API_BASE } from '@shared/constants/tvmaze';
import { handleApiError } from '../utils/requests';
import { client } from '../utils/honoClient';

export async function getUserProfile(): Promise<ApiResponse<ProfileData>> {
  try {
    const response = await client.api.user.profile.$get();
    const data = await response.json();
    if (data.ok) return { success: true, data: data.data };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getAllShows(): Promise<ApiResponse<ShowData[]>> {
  try {
    const response = await client.api.user.tvshows.$get();
    const data = await response.json();
    if (data.ok) return { success: true, data: data.data };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getOneShow(showID: string): Promise<ApiResponse<ShowData>> {
  try {
    const response = await client.api.user.tvshow[':id'].$get({ param: { id: showID } });
    const data = await response.json();
    if (data.ok) return { success: true, data: data.data };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function addNewShowById(tvMazeId: string): Promise<ApiResponse<{ status: string; showId?: number }>> {
  try {
    const response = await client.api.user.tvshow[':id'].$post({ param: { id: tvMazeId } });
    const data = await response.json();
    if (data.ok) return { success: true, data: data.data };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateShow(showID: string): Promise<ApiResponse<{ status: string; showId?: number }>> {
  try {
    const response = await client.api.user.tvshow[':id'].$patch({ param: { id: showID } });
    const data = await response.json();
    if (data.ok) return { success: true, data: data.data };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteShow(showID: string): Promise<ApiResponse<{ status: string; showId?: number }>> {
  try {
    const response = await client.api.user.tvshow[':id'].$delete({ param: { id: showID } });
    const data = await response.json();
    if (data.ok) return { success: true, data: data.data };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// TVMaze-direct functions — these call api.tvmaze.com directly, not our API

const EPISODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const episodeCache = new Map<string, { date: string; expiry: number }>();

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
      const cached = episodeCache.get(href);
      if (cached && Date.now() < cached.expiry) {
        return { success: true, data: { date: cached.date } };
      }
      const response = await axios.get(href, { signal });
      if (response.data?.airdate) {
        const date = new Date(response.data.airdate).toDateString();
        episodeCache.set(href, { date, expiry: Date.now() + EPISODE_CACHE_TTL_MS });
        return { success: true, data: { date } };
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
      const cached = episodeCache.get(href);
      if (cached && Date.now() < cached.expiry) {
        return { success: true, data: { date: cached.date } };
      }
      const response = await axios.get(href, { signal });
      if (response.data?.airdate) {
        const date = new Date(response.data.airdate).toDateString();
        episodeCache.set(href, { date, expiry: Date.now() + EPISODE_CACHE_TTL_MS });
        return { success: true, data: { date } };
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
    const response = await axios.get(`${TV_MAZE_API_BASE}/search/shows?q=${encodeURIComponent(showName)}`);
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError('tvShowResults', error);
  }
}

export async function returnSearchShow(showId: string): Promise<ApiResponse<TvMazeShow>> {
  try {
    const response = await axios.get(`${TV_MAZE_API_BASE}/shows/${showId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError('returnSearchShow', error);
  }
}

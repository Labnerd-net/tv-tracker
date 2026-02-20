import axios from 'axios';
import type { TvMazeSeries, TvMazeShow } from '@shared/types/tvmaze';
import type { ProfileData, ShowData } from '@shared/types/tv-tracker';
import { logger } from '../utils/logger';
import { getAuthHeaders, handleApiError } from '../utils/requests';

const tvMazeAPI = 'https://api.tvmaze.com';
const databaseAPI = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const path = 'api/user';

export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

export async function getUserProfile(): Promise<ProfileResponse> {
  try {
    const response = await axios.get(`${databaseAPI}/${path}/profile`, {
      headers: getAuthHeaders(),
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getUserProfile', error);
  }
}

export interface ShowResponse {
  success: boolean;
  data?: ShowData[];
  error?: string;
}

export async function getAllShows(): Promise<ShowResponse> {
  try {
    const response = await axios.get(`${databaseAPI}/${path}/tvshows`, {
      headers: getAuthHeaders(),
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getAllShows', error);
  }
}

export async function getOneShow(showID: string): Promise<ShowResponse> {
  try {
    const response = await axios.get(`${databaseAPI}/${path}/tvshow/${showID}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getOneShow', error);
  }
}

export interface StringResponse {
  success: boolean;
  data?: { status: string };
  error?: string;
}

export async function addNewShowJson(showData: TvMazeShow): Promise<StringResponse> {
  try {
    const response = await axios.post(`${databaseAPI}/${path}/tvshow`, showData, {
      headers: getAuthHeaders(),
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('addNewShowJson', error);
  }
}

export async function updateShow(showID: string): Promise<StringResponse> {
  try {
    const response = await axios.patch(
      `${databaseAPI}/${path}/tvshow/${showID}`,
      null,
      { headers: getAuthHeaders() },
    );
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('updateShow', error);
  }
}

export async function deleteShow(showID: string): Promise<StringResponse> {
  try {
    const response = await axios.delete(`${databaseAPI}/${path}/tvshow/${showID}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('deleteShow', error);
  }
}

export interface DateResponse {
  success: boolean;
  data?: { date: string };
  error?: string;
}

export async function fetchNextEpisodeDate(searchData: TvMazeShow): Promise<DateResponse> {
  try {
    if (searchData._links.nextepisode) {
      const response = await axios.get(searchData._links.nextepisode.href);
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

export async function fetchPrevEpisodeDate(searchData: TvMazeShow): Promise<DateResponse> {
  try {
    if (searchData._links.previousepisode) {
      const response = await axios.get(searchData._links.previousepisode.href);
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

export interface TvMazeShowsResponse {
  success: boolean;
  data?: TvMazeSeries[];
  error?: string;
}

export async function tvShowResults(showName: string): Promise<TvMazeShowsResponse> {
  try {
    const response = await axios.get(`${tvMazeAPI}/search/shows?q=${showName}`)
    return { success: true, data: response.data };
  } catch(error) {
    return handleApiError('tvShowResults', error);
  }
}

export interface TvMazeShowResponse {
  success: boolean;
  data?: TvMazeShow;
  error?: string;
}

export async function returnSearchShow(showId: string): Promise<TvMazeShowResponse> {
  try {
    const response = await axios.get(`${tvMazeAPI}/shows/${showId}`)
    return { success: true, data: response.data };
  } catch(error) {
    return handleApiError('returnSearchShow', error);
  }
}

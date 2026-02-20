import axios from 'axios';
import type { TvMazeShow } from '@shared/types/tvmaze';
import type { ProfileData, ShowData } from '@shared/types/tv-tracker';
import { logger } from '../utils/logger';

const tvMazeAPI = 'https://api.tvmaze.com';
const databaseAPI = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const path = 'api/user';

function getAuthHeaders() {
  const token = localStorage.getItem('jwt');
  return { Authorization: `Bearer ${token}` };
}

function handleApiError(fnName: string, error: unknown): { success: false; error: string } {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    logger.error(`${fnName} failed`, error.response.status, error.response.data.error);
    return { success: false, error: error.response.data.error };
  }
  logger.error(`${fnName} unexpected error`, error);
  return { success: false, error: 'An unexpected error occurred' };
}

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

export function returnPlatform(searchData: TvMazeShow): string {
  if (searchData.network) {
    return searchData.network.name;
  } else if (searchData.webChannel) {
    return searchData.webChannel.name;
  }
  return 'Not Available';
}

export async function returnNextEpisodeSearch(searchData: TvMazeShow): Promise<string> {
  if (searchData._links.nextepisode) {
    const nextEpisodeData = await axios.get(searchData._links.nextepisode.href);
    return new Date(nextEpisodeData.data.airdate).toDateString();
  }
  return 'No Scheduled Episode';
}

export async function tvShowResults(showName: string) {
  try {
    const response = await axios.get(`${tvMazeAPI}/search/shows?q=${showName}`)
    logger.debug('tvShowResults response', { count: response.data.length, showName });
    return response.data;
  } catch(error) {
    return handleApiError('tvShowResults', error);
  }
}

export async function returnSearchShow(showId: string) {
  try {
    const response = await axios.get(`${tvMazeAPI}/shows/${showId}`)
    logger.debug('returnSearchShow response', { showId });
    return response.data;
  } catch(error) {
    return handleApiError('returnSearchShow', error);
  }
}

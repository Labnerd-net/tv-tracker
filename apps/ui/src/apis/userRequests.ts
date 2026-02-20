import axios from 'axios';
import type { TvMazeShow } from '@shared/types/tvmaze';
import type { ProfileData } from '@shared/types/tv-tracker';
import { logger } from '../utils/logger';

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
    const token = localStorage.getItem('jwt');
    const response = await axios.get(`${databaseAPI}/${path}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      logger.error('getUserProfile failed', error.response.status, error.response.data.error);
      return { success: false, error: error.response.data.error };
    }
    logger.error('getUserProfile unexpected error', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function addNewShowJson(showData: TvMazeShow) {
  try {
    console.log(showData);
    const response = await axios.post(`${databaseAPI}/api/tvshow`, showData);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllShows() {
  try {
    console.log('All env vars:', import.meta.env);
    console.log('API URL being used:', databaseAPI);
    const response = await axios.get(`${databaseAPI}/api/tvshows`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getOneShow(showID: string) {
  try {
    const response = await axios.get(`${databaseAPI}/api/tvshow/${showID}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function updateShow(showID: string) {
  try {
    const response = await axios.patch(`${databaseAPI}/api/tvshow/${showID}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function deleteShow(showID: string) {
  try {
    const response = await axios.delete(`${databaseAPI}/api/tvshow/${showID}`);
    console.log(`Deleting finished.`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
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
    console.log(response.data);
    console.log(`Found ${response.data.length} shows about ${showName}`);
    return response.data;
  } catch(error) {
    console.log(error);
  }
}

export async function returnSearchShow(showId: string) {
  try {
    console.log(`URL: ${tvMazeAPI}/shows/${showId}`);
    const response = await axios.get(`${tvMazeAPI}/shows/${showId}`)
    console.log(response.data);
    return response.data;
  } catch(error) {
    console.log(error);
  }
}

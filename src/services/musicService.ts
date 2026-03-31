import { Track } from '../types';

/**
 * Service to interact with the Audius API for music data.
 * Audius is a decentralized music platform that provides full-length tracks.
 */
const APP_NAME = 'TUNEHUB';
const BASE_URL = 'https://discoveryprovider.audius.co/v1';

export async function searchMusic(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`
    );
    const { data } = await response.json();
    
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.user.name,
      artistId: item.user.id,
      album: item.genre || 'Single',
      cover: item.artwork?.['480x480'] || item.artwork?.['1000x1000'] || `https://picsum.photos/seed/${item.id}/400/400`,
      preview: `${BASE_URL}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
      duration: item.duration,
    }));
  } catch (error) {
    console.error('Error searching music:', error);
    return [];
  }
}

export async function getTopTracks(): Promise<Track[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/tracks/trending?app_name=${APP_NAME}`
    );
    const { data } = await response.json();
    
    return data.slice(0, 20).map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.user.name,
      artistId: item.user.id,
      album: item.genre || 'Trending',
      cover: item.artwork?.['480x480'] || item.artwork?.['1000x1000'] || `https://picsum.photos/seed/${item.id}/400/400`,
      preview: `${BASE_URL}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
      duration: item.duration,
    }));
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return [];
  }
}

export async function getArtistData(userId: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}?app_name=${APP_NAME}`);
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching artist data:', error);
    return null;
  }
}

export async function getArtistTracks(userId: string): Promise<Track[]> {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/tracks?app_name=${APP_NAME}`);
    const { data } = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.user.name,
      artistId: item.user.id,
      album: item.genre || 'Single',
      cover: item.artwork?.['480x480'] || item.artwork?.['1000x1000'] || `https://picsum.photos/seed/${item.id}/400/400`,
      preview: `${BASE_URL}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
      duration: item.duration,
    }));
  } catch (error) {
    console.error('Error fetching artist tracks:', error);
    return [];
  }
}

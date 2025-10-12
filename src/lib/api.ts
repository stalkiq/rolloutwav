export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hns1p6z899.execute-api.us-west-2.amazonaws.com';
import { refreshTokens } from './auth';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const idToken = typeof window !== 'undefined' ? localStorage.getItem('id_token') : null;
  let res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...(init?.headers || {}),
    },
    // Force no-cache to see new data while iterating
    cache: 'no-store',
  });
  if (res.status === 401) {
    // Best effort refresh if offline_access is ever enabled; otherwise fall back to redirect
    try {
      const refreshed = await refreshTokens();
      if (refreshed) {
        const newToken = typeof window !== 'undefined' ? localStorage.getItem('id_token') : null;
        res = await fetch(`${API_URL}${path}`, {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            ...(init?.headers || {}),
          },
          cache: 'no-store',
        });
      }
    } catch {}
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json();
}

export type ApiAlbum = { albumId: string; name: string; coverArtKey?: string | null };
export type ApiProject = {
  projectId: string;
  albumId: string;
  name: string;
  status?: string;
  priority?: string;
  targetDate?: string;
  finalSong?: { id: string; name: string; url: string; timestamp: string } | null;
};

export const api = {
  async listAlbums(): Promise<{ items: ApiAlbum[] }> {
    return http('/albums');
  },
  async createAlbum(input: { albumId?: string; name: string; coverArtKey?: string | null }): Promise<ApiAlbum> {
    return http('/albums', { method: 'POST', body: JSON.stringify(input) });
  },
  async updateAlbumCover(input: { albumId: string; coverArtKey: string | null; name?: string }): Promise<ApiAlbum> {
    return http('/albums', { method: 'PUT', body: JSON.stringify(input) });
  },
  async deleteAlbum(albumId: string): Promise<void> {
    await http(`/albums/${encodeURIComponent(albumId)}`, { method: 'DELETE' });
  },
  async listProjects(albumId: string): Promise<{ items: ApiProject[] }> {
    return http(`/projects?albumId=${encodeURIComponent(albumId)}`);
  },
  async createProject(input: { albumId: string; name: string; status?: string; priority?: string; targetDate?: string; type?: string }): Promise<ApiProject> {
    return http('/projects', { method: 'POST', body: JSON.stringify(input) });
  },
  async updateProject(albumId: string, projectId: string, payload: any): Promise<ApiProject> {
    return http(`/projects/${encodeURIComponent(projectId)}?albumId=${encodeURIComponent(albumId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async deleteProject(albumId: string, projectId: string): Promise<void> {
    await http(`/projects/${encodeURIComponent(projectId)}?albumId=${encodeURIComponent(albumId)}`, { method: 'DELETE' });
  },
  async resetProject(albumId: string, projectId: string): Promise<ApiProject> {
    // Clears all content fields while preserving name and status/priority
    return http(`/projects/${encodeURIComponent(projectId)}?albumId=${encodeURIComponent(albumId)}`, {
      method: 'PUT',
      body: JSON.stringify({ verses: [], hooks: [], beats: [], samples: [], finalSong: null }),
    });
  },
  async presign(input: { filename?: string; contentType?: string; key?: string; action?: 'put' | 'get'; hash?: string }): Promise<{ url: string; key: string }> {
    return http('/uploads/presign', { method: 'POST', body: JSON.stringify(input) });
  }
};



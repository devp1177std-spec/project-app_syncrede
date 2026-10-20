import {
  ApiResponse,
  UserProfile,
  UsernameCheckResponse,
  PresignedUrlResponse,
  UserProfileResponse,
  UserGridPostsResponse,
  FollowListResponse,
  FollowActionResult,
  UserStoryGroupDto,
  StoryDto,
  CreateStoryDto,
  StoryViewUserDto,
} from '@social/types';
import { OnboardingProfileInput, SignUpInput } from '@social/validation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('social_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('social_auth_token', token);
  } else {
    localStorage.removeItem('social_auth_token');
  }
}

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${cleanBase}/${cleanEndpoint}`;

  try {
    const token = getAuthToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown network error',
      },
    };
  }
}

export const apiClient = {
  auth: {
    async getSession(): Promise<{ user: UserProfile | null; session: any | null }> {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
        if (!res.ok) return { user: null, session: null };
        const data = await res.json();
        return {
          user: data?.user || null,
          session: data?.session || null,
        };
      } catch {
        return { user: null, session: null };
      }
    },

    async signIn(identifier: string, password: string): Promise<ApiResponse<any>> {
      const isEmail = identifier.includes('@');
      const endpoint = isEmail ? 'api/auth/sign-in/email' : 'api/auth/sign-in/username';
      const body = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      try {
        const cleanBase = API_BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${cleanBase}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (data?.token) {
            setAuthToken(data.token);
          }
          return {
            success: true,
            data: data?.user || data,
          };
        }
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: data?.message || data?.error || 'Invalid credentials',
          },
        };
      } catch (e: any) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: e?.message || 'Network error connecting to auth server',
          },
        };
      }
    },

    async signUp(input: SignUpInput): Promise<ApiResponse<any>> {
      try {
        const cleanBase = API_BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${cleanBase}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (data?.token) {
            setAuthToken(data.token);
          }
          return {
            success: true,
            data: data?.user || data,
          };
        }
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: data?.message || data?.error || 'Registration failed',
          },
        };
      } catch (e: any) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: e?.message || 'Network error connecting to auth server',
          },
        };
      }
    },

    async signOut(): Promise<void> {
      setAuthToken(null);
      try {
        await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        console.error('Sign out error:', e);
      }
    },
  },

  users: {
    async checkUsername(username: string): Promise<UsernameCheckResponse> {
      try {
        const cleanBase = API_BASE_URL.replace(/\/$/, '');
        const res = await fetch(
          `${cleanBase}/api/users/check-username?u=${encodeURIComponent(username)}`,
          { credentials: 'include' },
        );
        if (res.ok) {
          const json = await res.json();
          // Support direct { available: boolean } or wrapped { data: { available: boolean } }
          if (json && typeof json.available === 'boolean') {
            return json;
          }
          if (json?.data && typeof json.data.available === 'boolean') {
            return json.data;
          }
        }
      } catch (e) {
        console.warn('Backend check-username unreachable, using local validation:', e);
      }

      // Check reserved usernames locally if backend is unavailable or offline
      const reserved = ['admin', 'root', 'support', 'help', 'api', 'auth', 'system', 'superuser'];
      const isReserved = reserved.includes(username.toLowerCase());
      return {
        available: !isReserved,
        suggestions: isReserved ? [`${username}1`, `${username}_pro`, `${username}_99`] : [],
      };
    },

    async updateProfile(data: OnboardingProfileInput): Promise<ApiResponse<UserProfile>> {
      return fetchApi<UserProfile>('api/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async getProfile(username: string): Promise<ApiResponse<UserProfileResponse>> {
      return fetchApi<UserProfileResponse>(`api/users/${encodeURIComponent(username)}`);
    },

    async getUserPosts(
      username: string,
      query: { sort?: 'latest' | 'popular' | 'old'; cursor?: string; limit?: number } = {},
    ): Promise<ApiResponse<UserGridPostsResponse>> {
      const params = new URLSearchParams();
      if (query.sort) params.set('sort', query.sort);
      if (query.cursor) params.set('cursor', query.cursor);
      if (query.limit) params.set('limit', String(query.limit));
      const queryString = params.toString();
      const endpoint = `api/users/${encodeURIComponent(username)}/posts${queryString ? `?${queryString}` : ''}`;
      return fetchApi<UserGridPostsResponse>(endpoint);
    },

    async getFollowing(
      username: string,
      query: { cursor?: string; limit?: number } = {},
    ): Promise<ApiResponse<FollowListResponse>> {
      const params = new URLSearchParams();
      if (query.cursor) params.set('cursor', query.cursor);
      if (query.limit) params.set('limit', String(query.limit));
      const queryString = params.toString();
      const endpoint = `api/users/${encodeURIComponent(username)}/following${queryString ? `?${queryString}` : ''}`;
      return fetchApi<FollowListResponse>(endpoint);
    },

    async follow(username: string): Promise<ApiResponse<FollowActionResult>> {
      return fetchApi<FollowActionResult>(`api/users/${encodeURIComponent(username)}/follow`, {
        method: 'POST',
      });
    },

    async unfollow(username: string): Promise<ApiResponse<FollowActionResult>> {
      return fetchApi<FollowActionResult>(`api/users/${encodeURIComponent(username)}/follow`, {
        method: 'DELETE',
      });
    },

    async block(username: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
      return fetchApi<{ isBlocked: boolean }>(`api/users/${encodeURIComponent(username)}/block`, {
        method: 'POST',
      });
    },

    async mute(username: string): Promise<ApiResponse<{ isMuted: boolean }>> {
      return fetchApi<{ isMuted: boolean }>(`api/users/${encodeURIComponent(username)}/mute`, {
        method: 'POST',
      });
    },
  },

  storage: {
    async getPresignedUrl(
      filename: string,
      contentType: string,
    ): Promise<ApiResponse<PresignedUrlResponse>> {
      return fetchApi<PresignedUrlResponse>('api/storage/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType }),
      });
    },

    async uploadToPresignedUrl(
      uploadUrl: string,
      fileBlob: Blob,
      contentType: string,
    ): Promise<boolean> {
      try {
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          body: fileBlob,
        });
        return res.ok;
      } catch (e) {
        console.error('Upload to presigned URL failed:', e);
        return false;
      }
    },
  },

  health: {
    async check(): Promise<ApiResponse<{ status: string; dbConnected: boolean }>> {
      return fetchApi('api/health');
    },
  },

  stories: {
    async getFeed(): Promise<ApiResponse<UserStoryGroupDto[]>> {
      return fetchApi<UserStoryGroupDto[]>('api/stories/feed');
    },

    async getByUsername(username: string): Promise<ApiResponse<UserStoryGroupDto>> {
      return fetchApi<UserStoryGroupDto>(`api/stories/user/${encodeURIComponent(username)}`);
    },

    async create(dto: CreateStoryDto): Promise<ApiResponse<StoryDto>> {
      return fetchApi<StoryDto>('api/stories', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async recordView(storyId: string): Promise<ApiResponse<{ viewed: boolean; storyId: string; viewedAt: string }>> {
      return fetchApi<{ viewed: boolean; storyId: string; viewedAt: string }>(`api/stories/${encodeURIComponent(storyId)}/view`, {
        method: 'POST',
      });
    },

    async delete(storyId: string): Promise<ApiResponse<{ success: boolean; deletedStoryId: string }>> {
      return fetchApi<{ success: boolean; deletedStoryId: string }>(`api/stories/${encodeURIComponent(storyId)}`, {
        method: 'DELETE',
      });
    },

    async getViewers(storyId: string): Promise<ApiResponse<StoryViewUserDto[]>> {
      return fetchApi<StoryViewUserDto[]>(`api/stories/${encodeURIComponent(storyId)}/views`);
    },
  },
};

export const api = apiClient;



import { Chat } from '../../domain/entities/chat';
import { Message } from '../../domain/entities/message';
import { Personality } from '../../domain/entities/personality';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5083';

// Helper to get JWT token from localStorage
const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('garionx_token');
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : {
        'Content-Type': 'application/json',
      };
};

const FALLBACK_PERSONALITIES: Personality[] = [
  {
    id: 'garionx',
    name: 'GarionX Core',
    description: 'The cybernetic default model designed for high-context analytical thinking and system design.',
    systemPrompt: 'You are GarionX Core, a futuristic cybernetic companion.',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=garionx'
  },
  {
    id: 'helpful',
    name: 'Serena (Helpful)',
    description: 'A friendly and polite digital assistant specialized in general task planning and brainstorming.',
    systemPrompt: 'You are Serena, a warm and helpful assistant.',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=helpful'
  },
  {
    id: 'coder',
    name: 'SyntaxVortex (Coder)',
    description: 'A logic-driven compiler-like brain. Outputs ready-to-run code blocks and design patterns.',
    systemPrompt: 'You are SyntaxVortex, a master programmer.',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=coder'
  },
  {
    id: 'creative',
    name: 'Muse (Creative)',
    description: 'An imaginative writer that helps with storytelling, copy editing, and philosophical analogies.',
    systemPrompt: 'You are Muse, a creative storyteller.',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=creative'
  }
];

export class ChatApiDataSource {
  async getPersonalities(): Promise<Personality[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/personalities`);
      if (!response.ok) {
        throw new Error('Failed to fetch personalities');
      }
      return await response.json();
    } catch (error) {
      console.warn('[GarionX API] Failed to fetch personalities from backend. Using local static fallbacks. Error:', error);
      return FALLBACK_PERSONALITIES;
    }
  }

  async getChats(): Promise<Chat[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/chats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      return data.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    } catch (error) {
      console.warn('[GarionX API] Failed to fetch chats from backend. Error:', error);
      return [];
    }
  }

  async createChat(personalityId: string, model: string): Promise<Chat> {
    const response = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ personalityId, model }),
    });
    if (!response.ok) {
      throw new Error('Failed to create chat');
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
    };
  }

  async deleteChat(chatId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
  }

  async getMessages(chatId: string): Promise<Message[]> {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    return data.map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
  }

  async sendMessage(
    chatId: string,
    content: string,
    model: string,
    attachmentUrl?: string,
    attachmentType?: string
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, model, attachmentUrl, attachmentType }),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    const data = await response.json();
    return {
      userMessage: {
        ...data.userMessage,
        createdAt: new Date(data.userMessage.createdAt),
      },
      assistantMessage: {
        ...data.assistantMessage,
        createdAt: new Date(data.assistantMessage.createdAt),
      },
    };
  }

  // Authentication API calls
  async getProfile(): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Failed to fetch profile');
    }
    return response.json();
  }

  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Login failed');
    }
    return response.json();
  }

  async register(username: string, password: string, email: string, name: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, name }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Registration failed');
    }
    return response.json();
  }

  async loginWithGoogle(idToken: string, displayName?: string | null, photoUrl?: string | null): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, displayName, photoUrl }),
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || 'Google authentication failed');
      }
      return await response.json();
    } catch (error: any) {
      console.warn('[GarionX API] Google authentication request failed:', error);
      throw new Error(error.message || 'Could not connect to the backend server. Make sure the backend project is running.');
    }
  }

  async updateProfile(name: string, email: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, email }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Failed to update profile');
    }
    return response.json();
  }

  async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('garionx_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BASE_URL}/api/auth/profile/upload-avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Failed to upload avatar');
    }
    return response.json();
  }
  async getTokenUsage(): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/usage`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Failed to fetch usage data');
    }
    return response.json();
  }

  async createPersonality(name: string, description: string, systemPrompt: string): Promise<Personality> {
    const response = await fetch(`${BASE_URL}/api/personalities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description, systemPrompt }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Failed to create agent');
    }
    return response.json();
  }

  async pinChat(chatId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}/pin`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to toggle pin on chat');
    }
  }

  async archiveChat(chatId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}/archive`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to toggle archive on chat');
    }
  }

  async shareChat(chatId: string): Promise<{ shareToken: string }> {
    const response = await fetch(`${BASE_URL}/api/chats/${chatId}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to share chat');
    }
    return response.json();
  }

  async getSharedChat(shareToken: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/chats/shared/${shareToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Shared chat not found');
    }
    return response.json();
  }

  async uploadFile(file: File): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('garionx_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BASE_URL}/api/chats/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Failed to upload file');
    }
    return response.json();
  }
}
export const apiDataSource = new ChatApiDataSource();

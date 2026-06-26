import { Chat } from '../../domain/entities/chat';
import { Message } from '../../domain/entities/message';

export interface ChatLocalDataSource {
  getChats(): Promise<Chat[]>;
  saveChats(chats: Chat[]): Promise<void>;
  getMessages(chatId: string): Promise<Message[]>;
  saveMessages(chatId: string, messages: Message[]): Promise<void>;
  deleteChatData(chatId: string): Promise<void>;
}

export class ChatLocalDataSourceImpl implements ChatLocalDataSource {
  private chatsKey = 'garionx_chats';
  private messagesKeyPrefix = 'garionx_messages_';

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  async getChats(): Promise<Chat[]> {
    if (!this.isBrowser()) return [];
    const raw = localStorage.getItem(this.chatsKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    } catch {
      return [];
    }
  }

  async saveChats(chats: Chat[]): Promise<void> {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.chatsKey, JSON.stringify(chats));
  }

  async getMessages(chatId: string): Promise<Message[]> {
    if (!this.isBrowser()) return [];
    const raw = localStorage.getItem(`${this.messagesKeyPrefix}${chatId}`);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return parsed.map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
    } catch {
      return [];
    }
  }

  async saveMessages(chatId: string, messages: Message[]): Promise<void> {
    if (!this.isBrowser()) return;
    localStorage.setItem(`${this.messagesKeyPrefix}${chatId}`, JSON.stringify(messages));
  }

  async deleteChatData(chatId: string): Promise<void> {
    if (!this.isBrowser()) return;
    localStorage.removeItem(`${this.messagesKeyPrefix}${chatId}`);
  }
}

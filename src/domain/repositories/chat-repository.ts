import { Chat } from '../entities/chat';
import { Message } from '../entities/message';

export interface ChatRepository {
  getChats(): Promise<Chat[]>;
  createChat(personalityId: string, model: string): Promise<Chat>;
  deleteChat(chatId: string): Promise<void>;
  getMessages(chatId: string): Promise<Message[]>;
  addUserMessage(chatId: string, content: string, model: string, attachmentUrl?: string, attachmentType?: string): Promise<Message>;
  sendMessage(chatId: string, messageContent: string, personalityId: string, model: string, attachmentUrl?: string, attachmentType?: string): Promise<Message>;
}

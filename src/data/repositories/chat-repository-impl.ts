import { Chat } from '../../domain/entities/chat';
import { Message } from '../../domain/entities/message';
import { ChatRepository } from '../../domain/repositories/chat-repository';
import { apiDataSource } from '../datasources/chat-api-datasource';

export class ChatRepositoryImpl implements ChatRepository {
  // We keep a temporary cache of the API response to coordinate between addUserMessage and sendMessage
  private lastApiResponse: { userMessage: Message; assistantMessage: Message } | null = null;

  async getChats(): Promise<Chat[]> {
    return apiDataSource.getChats();
  }

  async createChat(personalityId: string, model: string): Promise<Chat> {
    return apiDataSource.createChat(personalityId, model);
  }

  async deleteChat(chatId: string): Promise<void> {
    return apiDataSource.deleteChat(chatId);
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return apiDataSource.getMessages(chatId);
  }

  async addUserMessage(chatId: string, content: string, model: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> {
    try {
      const response = await apiDataSource.sendMessage(chatId, content, model, attachmentUrl, attachmentType);
      this.lastApiResponse = response;
      return response.userMessage;
    } catch (error) {
      console.error('API Send Message failed:', error);
      return {
        id: 'error-user-' + Date.now(),
        chatId,
        sender: 'user',
        content,
        createdAt: new Date(),
        attachmentUrl,
        attachmentType
      };
    }
  }

  async sendMessage(chatId: string, messageContent: string, personalityId: string, model: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> {
    if (this.lastApiResponse) {
      const assistantMessage = this.lastApiResponse.assistantMessage;
      this.lastApiResponse = null; // Clear cache
      return assistantMessage;
    }

    const response = await apiDataSource.sendMessage(chatId, messageContent, model, attachmentUrl, attachmentType);
    return response.assistantMessage;
  }
}

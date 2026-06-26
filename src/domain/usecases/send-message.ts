import { Message } from '../entities/message';
import { ChatRepository } from '../repositories/chat-repository';

export class SendMessageUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async execute(
    chatId: string,
    content: string,
    personalityId: string,
    model: string,
    attachmentUrl?: string,
    attachmentType?: string
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const userMessage = await this.chatRepository.addUserMessage(chatId, content, model, attachmentUrl, attachmentType);
    const assistantMessage = await this.chatRepository.sendMessage(chatId, content, personalityId, model, attachmentUrl, attachmentType);
    return { userMessage, assistantMessage };
  }
}

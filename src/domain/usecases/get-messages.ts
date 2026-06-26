import { Message } from '../entities/message';
import { ChatRepository } from '../repositories/chat-repository';

export class GetMessagesUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async execute(chatId: string): Promise<Message[]> {
    return this.chatRepository.getMessages(chatId);
  }
}

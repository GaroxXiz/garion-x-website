import { Chat } from '../entities/chat';
import { ChatRepository } from '../repositories/chat-repository';

export class CreateChatUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async execute(personalityId: string, model: string): Promise<Chat> {
    return this.chatRepository.createChat(personalityId, model);
  }
}

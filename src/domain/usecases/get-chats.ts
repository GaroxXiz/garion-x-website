import { Chat } from '../entities/chat';
import { ChatRepository } from '../repositories/chat-repository';

export class GetChatsUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async execute(): Promise<Chat[]> {
    return this.chatRepository.getChats();
  }
}

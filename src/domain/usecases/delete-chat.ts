import { ChatRepository } from '../repositories/chat-repository';

export class DeleteChatUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async execute(chatId: string): Promise<void> {
    return this.chatRepository.deleteChat(chatId);
  }
}

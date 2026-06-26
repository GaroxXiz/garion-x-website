export interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  attachmentUrl?: string;
  attachmentType?: string;
}

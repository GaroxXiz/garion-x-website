export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  personalityId: string;
  model: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isShared?: boolean;
  shareToken?: string;
}

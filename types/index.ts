export interface Package {
  _id?: string;
  trackingNumber: string;
  carrier: string;
  description?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'exception' | 'expired';
  events: TrackingEvent[];
  createdAt: Date;
  updatedAt: Date;
  telegramChatId?: string;
  notificationEnabled: boolean;
}

export interface TrackingEvent {
  date: Date;
  description: string;
  desc?: string;
  location?: string;
  status: string;
}

export interface TrackingResponse {
  success: boolean;
  data?: {
    number: string;
    carrier: string;
    status: string;
    events: TrackingEvent[];
  };
  error?: string;
}

export interface TelegramMessage {
  chatId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}
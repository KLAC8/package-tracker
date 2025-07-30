import axios from 'axios';
import { TelegramMessage } from '@/types';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export class TelegramBot {
  private baseUrl = `https://api.telegram.org/bot${BOT_TOKEN}`;

  async sendMessage({ chatId, message, parseMode = 'HTML' }: TelegramMessage): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId || CHAT_ID,
        text: message,
        parse_mode: parseMode
      });

      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendPackageUpdate(trackingNumber: string, status: string, description: string): Promise<boolean> {
    const message = `
📦 <b>Package Update</b>

🔢 <b>Tracking:</b> ${trackingNumber}
📊 <b>Status:</b> ${status.toUpperCase()}
📝 <b>Description:</b> ${description}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    return this.sendMessage({
      chatId: CHAT_ID,
      message,
      parseMode: 'HTML'
    });
  }

  async sendDeliveryNotification(trackingNumber: string, description?: string): Promise<boolean> {
    const message = `
🎉 <b>Package Delivered!</b>

📦 <b>Tracking:</b> ${trackingNumber}
${description ? `📝 <b>Description:</b> ${description}` : ''}
✅ <b>Status:</b> DELIVERED
🕐 <b>Time:</b> ${new Date().toLocaleString()}

Your package has been successfully delivered! 🚚📬
    `.trim();

    return this.sendMessage({
      chatId: CHAT_ID,
      message,
      parseMode: 'HTML'
    });
  }
}

export const telegramBot = new TelegramBot();
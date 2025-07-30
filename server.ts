import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { track17API } from './lib/17track';
import { isValidTrackingNumber } from './lib/validateTracking';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const app = express();

app.use(bodyParser.json());

app.post('/webhook/telegram', async (req, res) => {
  try {
    const message = req.body.message;
    const chatId = message.chat.id;
    const text = message.text?.trim();

    if (!text) {
      return res.sendStatus(200);
    }

    if (text === '/start') {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: `👋 <b>Welcome to PackTracker!</b>\n\nSend one or more tracking numbers (Temu, Shein, AliExpress, Alibaba) to get real-time updates. 📦📬`,
        parse_mode: 'HTML',
      });
      return res.sendStatus(200);
    }

    // Split by space, comma, or newline
    const inputTrackingNumbers = text
      .split(/[\s,]+/)
      .map((t: string) => t.trim().toUpperCase())
      .filter(Boolean);

    if (inputTrackingNumbers.length === 0) {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: `❌ No tracking number found. Please send one or more valid tracking numbers.`,
        parse_mode: 'HTML',
      });
      return res.sendStatus(200);
    }

    const responses: string[] = [];

    for (const trackingNumber of inputTrackingNumbers) {
      if (!isValidTrackingNumber(trackingNumber)) {
        responses.push(`⚠️ <b>${trackingNumber}</b>: Invalid tracking number.`);
        continue;
      }

      try {
        const tracking = await track17API.getTrackingInfo(trackingNumber);

        if (tracking.success) {
          const data = tracking.data;
          const status = data?.status || 'Unknown';
          const latestEvent = data?.events?.[0];
          const latest = latestEvent?.description || latestEvent?.desc || 'No tracking events yet.';

          responses.push(
            `📦 <b>${trackingNumber}</b>\n<b>Status:</b> ${status}\n<b>Latest:</b> ${latest}`
          );
        } else {
          responses.push(`❌ <b>${trackingNumber}</b>: Tracking failed or not found.`);
        }
      } catch (err) {
        console.error(`Error fetching tracking info for ${trackingNumber}:`, err);
        responses.push(`❌ <b>${trackingNumber}</b>: Error occurred while fetching.`);
      }
    }

    const finalMessage = responses.join('\n\n');

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: finalMessage,
      parse_mode: 'HTML',
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Telegram bot server running on port ${PORT}`);
});

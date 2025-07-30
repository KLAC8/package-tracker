// app/api/webhook/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import mongoose from 'mongoose';
import { track17API } from '@/lib/17track';
import { isValidTrackingNumber } from '@/lib/validateTracking';
import User from '@/models/User';
import Package from '@/models/Package';

// Telegram API types
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const MONGODB_URI = process.env.MONGODB_URI!;

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
}

// Store user states for conversation flow (in production, use Redis or database)
const userStates = new Map<string, { waitingForTracking: boolean }>();

// Send message helper function
async function sendMessage(chatId: string, text: string, parseMode: string = 'HTML') {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Create or update user in database
async function createOrUpdateUser(telegramUser: TelegramUser, chatId: string) {
  try {
    await connectDB();
    
    const userData = {
      chatId,
      userId: telegramUser.id,
      username: telegramUser.username || null,
      firstName: telegramUser.first_name || null,
      lastName: telegramUser.last_name || null,
      notificationsEnabled: true
    };

    const user = await User.findOneAndUpdate(
      { chatId },
      userData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`User created/updated: ${chatId} (${telegramUser.username || 'no username'})`);
    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

// Handle /start command
async function handleStartCommand(chatId: string, telegramUser: TelegramUser) {
  try {
    await createOrUpdateUser(telegramUser, chatId);

    const welcomeMessage = `
🎉 <b>Welcome to PackTracker Bot!</b>

I help you track your packages from Temu, Shein, AliExpress, and Alibaba with automatic 6-hour update notifications! 📦

<b>How it works:</b>
📍 Send me your tracking number
🔄 I'll track it automatically 
⏰ Get updates every 6 hours
🚚 Receive delivery notifications

<b>Commands:</b>
/help - Show help information
/list - View your tracked packages
/stop - Stop tracking a package

<b>Please send me a tracking number to get started!</b> 👇
    `.trim();

    await sendMessage(chatId, welcomeMessage);
    userStates.set(chatId, { waitingForTracking: true });
  } catch (error) {
    console.error('Error handling start command:', error);
    await sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
}

// Handle tracking number input
async function handleTrackingNumberInput(chatId: string, input: string, telegramUser: TelegramUser) {
  try {
    await connectDB();
    
    // Ensure user exists in database
    await createOrUpdateUser(telegramUser, chatId);
    
    userStates.delete(chatId);

    const inputTrackingNumbers = input
      .split(/[\s,\n]+/)
      .map((t: string) => t.trim().toUpperCase())
      .filter(Boolean);

    if (inputTrackingNumbers.length === 0) {
      await sendMessage(chatId, `❌ No tracking number found. Please send a valid tracking number.`);
      userStates.set(chatId, { waitingForTracking: true });
      return;
    }

    const responses: string[] = [];
    const user = await User.findOne({ chatId });

    for (const trackingNumber of inputTrackingNumbers) {
      if (!isValidTrackingNumber(trackingNumber)) {
        responses.push(`⚠️ <b>${trackingNumber}</b>: Invalid tracking number format.`);
        continue;
      }

      const existingPackage = await Package.findOne({ trackingNumber });
      if (existingPackage) {
        responses.push(`📦 <b>${trackingNumber}</b>: Already being tracked!`);
        continue;
      }

      try {
        const tracking = await track17API.getTrackingInfo(trackingNumber);

        if (tracking.success && tracking.data) {
          const newPackage = new Package({
            trackingNumber,
            carrier: tracking.data.carrier || 'Unknown',
            status: tracking.data.status || 'pending',
            events: tracking.data.events || [],
            telegramChatId: chatId,
            notificationEnabled: true
          });

          await newPackage.save();

          if (user) {
            if (!user.trackedPackages.includes(trackingNumber)) {
              user.trackedPackages.push(trackingNumber);
              await user.save();
            }
          }

          const status = tracking.data.status || 'Unknown';
          const latestEvent = tracking.data.events?.[0];
          const latest = latestEvent?.description || latestEvent?.desc || 'No tracking events yet.';

          responses.push(`
✅ <b>${trackingNumber}</b> - Successfully added to tracking!

📊 <b>Status:</b> ${status}
📝 <b>Latest Update:</b> ${latest}
⏰ <b>6-hour notifications:</b> Enabled

I'll keep you updated on any changes! 🔔
          `.trim());
        } else {
          responses.push(`❌ <b>${trackingNumber}</b>: Unable to fetch tracking information. Please check the number and try again.`);
        }
      } catch (err) {
        console.error(`Error fetching tracking info for ${trackingNumber}:`, err);
        responses.push(`❌ <b>${trackingNumber}</b>: Error occurred while adding to tracking.`);
      }
    }

    const finalMessage = responses.join('\n\n');
    await sendMessage(chatId, finalMessage);

    // Ask if they want to add more packages
    setTimeout(async () => {
      await sendMessage(chatId, `
📦 <b>Add more packages?</b>

Send me another tracking number or use:
/list - View tracked packages
/help - Show help menu
      `.trim());
    }, 2000);

  } catch (error) {
    console.error('Error handling tracking number input:', error);
    await sendMessage(chatId, '❌ An error occurred while processing your tracking number. Please try again.');
  }
}

// Handle /help command
async function handleHelpCommand(chatId: string, telegramUser: TelegramUser) {
  try {
    // Ensure user exists in database
    await createOrUpdateUser(telegramUser, chatId);
    
    const helpMessage = `
🤖 <b>PackTracker Bot Help</b>

<b>Commands:</b>
/start - Start the bot and add tracking
/help - Show this help message
/list - View your tracked packages
/stop - Stop tracking a package

<b>Supported Carriers:</b>
📦 Temu (YT format)
🛍️ Shein (LB format)
🛒 AliExpress (YT format)
🏭 Alibaba (LP format)

<b>Features:</b>
⏰ 6-hour automatic updates
🚚 Delivery notifications
📊 Real-time status tracking
🔔 Customizable notifications

<b>Just send me a tracking number anytime!</b>
    `.trim();

    await sendMessage(chatId, helpMessage);
  } catch (error) {
    console.error('Error handling help command:', error);
    await sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
}

// Handle /list command
async function handleListCommand(chatId: string, telegramUser: TelegramUser) {
  try {
    await connectDB();
    
    // Ensure user exists in database
    await createOrUpdateUser(telegramUser, chatId);
    
    const packages = await Package.find({ telegramChatId: chatId }).sort({ createdAt: -1 });

    if (packages.length === 0) {
      await sendMessage(chatId, `
📦 <b>No Tracked Packages</b>

You don't have any packages being tracked yet.

Send me a tracking number to get started! 👇
      `.trim());
      return;
    }

    let listMessage = `📦 <b>Your Tracked Packages (${packages.length})</b>\n\n`;

    for (const pkg of packages) {
      const latestEvent = pkg.events?.[0];
      const latest = latestEvent?.description || 'No updates yet';
      const statusEmoji = getStatusEmoji(pkg.status);

      listMessage += `
${statusEmoji} <b>${pkg.trackingNumber}</b>
📊 Status: ${pkg.status.toUpperCase()}
📝 Latest: ${latest}
🕐 Last Updated: ${pkg.updatedAt.toLocaleDateString()}

`;
    }

    listMessage += `\n💡 Use /stop to stop tracking a package`;

    await sendMessage(chatId, listMessage.trim());
  } catch (error) {
    console.error('Error handling list command:', error);
    await sendMessage(chatId, '❌ Error fetching your tracked packages.');
  }
}

// Get status emoji
function getStatusEmoji(status: string): string {
  switch (status.toLowerCase()) {
    case 'delivered': return '✅';
    case 'in_transit': return '🚚';
    case 'pending': return '⏳';
    case 'exception': return '⚠️';
    default: return '📦';
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;
    
    if (!message) {
      return NextResponse.json({ success: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text?.trim();
    const telegramUser = message.from; // This contains user info

    if (!text || !telegramUser) {
      return NextResponse.json({ success: true });
    }

    console.log(`Received message from ${chatId}: ${text} (User: ${telegramUser.username || telegramUser.first_name || 'Unknown'})`);

    if (text === '/start') {
      await handleStartCommand(chatId, telegramUser);
    } else if (text === '/help') {
      await handleHelpCommand(chatId, telegramUser);
    } else if (text === '/list') {
      await handleListCommand(chatId, telegramUser);
    } else {
      // Check if user is in tracking number input mode or treat as tracking number
      const userState = userStates.get(chatId);
      if (userState?.waitingForTracking || isValidTrackingNumber(text.split(/[\s,\n]+/)[0]?.trim().toUpperCase())) {
        await handleTrackingNumberInput(chatId, text, telegramUser);
      } else {
        // Ensure user exists even for unknown commands
        await createOrUpdateUser(telegramUser, chatId);
        
        await sendMessage(chatId, `
❓ <b>Unknown command</b>

Use these commands:
/start - Start tracking packages
/help - Show help
/list - View tracked packages

Or send me a tracking number! 📦
        `.trim());
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Telegram webhook endpoint is running'
  });
}
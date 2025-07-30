/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cron/update-packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import mongoose from 'mongoose';
import { track17API } from '@/lib/17track';
import Package from '@/models/Package';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const MONGODB_URI = process.env.MONGODB_URI!;
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB for cron job');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
}

async function sendMessage(chatId: string, text: string) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// POST handler for cron job
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from your cron service (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running 6-hour package update check...');
    
    await connectDB();
    
    const packages = await Package.find({ 
      notificationEnabled: true,
      status: { $nin: ['delivered', 'expired'] }
    });

    console.log(`Found ${packages.length} packages to check`);

    const results = [];

    for (const pkg of packages) {
      try {
        console.log(`Checking package: ${pkg.trackingNumber}`);
        
        const tracking = await track17API.getTrackingInfo(pkg.trackingNumber);
        
        if (tracking.success && tracking.data) {
          const oldStatus = pkg.status;
          const newStatus = tracking.data.status;
          const oldEventsCount = pkg.events?.length || 0;
          const newEventsCount = tracking.data.events?.length || 0;
          const hasNewEvents = newEventsCount > oldEventsCount;

          // Update package if status changed or new events
          if (oldStatus !== newStatus || hasNewEvents) {
            pkg.status = newStatus;
            pkg.events = tracking.data.events || [];
            await pkg.save();

            const latestEvent = tracking.data.events?.[0];
            const eventDesc = latestEvent?.description || latestEvent?.desc || 'Status updated';

            if (newStatus === 'delivered') {
              await sendMessage(pkg.telegramChatId, `
🎉 <b>Package Delivered!</b>

📦 <b>Tracking:</b> ${pkg.trackingNumber}
✅ <b>Status:</b> DELIVERED
📝 <b>Description:</b> ${eventDesc}
🕐 <b>Time:</b> ${new Date().toLocaleString()}

Your package has been successfully delivered! 🚚📬

Use /list to see all your packages.
              `.trim());
            } else if (oldStatus !== newStatus || hasNewEvents) {
              await sendMessage(pkg.telegramChatId, `
📦 <b>Package Update</b>

🔢 <b>Tracking:</b> ${pkg.trackingNumber}
📊 <b>Status:</b> ${newStatus.toUpperCase()}
📝 <b>Latest Update:</b> ${eventDesc}
🕐 <b>Time:</b> ${new Date().toLocaleString()}

${hasNewEvents ? '🆕 New tracking event detected!' : ''}

Use /list to see all your packages.
              `.trim());
            }

            results.push({
              trackingNumber: pkg.trackingNumber,
              oldStatus,
              newStatus,
              hasNewEvents,
              updated: true
            });

            console.log(`Updated ${pkg.trackingNumber}: ${oldStatus} -> ${newStatus}`);
          } else {
            results.push({
              trackingNumber: pkg.trackingNumber,
              status: pkg.status,
              updated: false,
              reason: 'No changes detected'
            });
          }
        } else {
          results.push({
            trackingNumber: pkg.trackingNumber,
            error: tracking.error || 'Failed to get tracking info',
            updated: false
          });
          console.log(`Failed to get tracking info for ${pkg.trackingNumber}`);
        }

        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Error updating package ${pkg.trackingNumber}:`, error);
        results.push({
          trackingNumber: pkg.trackingNumber,
          error: error.message,
          updated: false
        });
      }
    }

    const updatedCount = results.filter(r => r.updated).length;
    const errorCount = results.filter(r => r.error).length;

    console.log(`Cron job completed: ${updatedCount} updated, ${errorCount} errors`);

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${packages.length} packages`,
      summary: {
        total: packages.length,
        updated: updatedCount,
        errors: errorCount
      },
      results 
    });
  } catch (error: any) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Cron job failed',
      details: error.message
    }, { status: 500 });
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Package update cron endpoint',
    usage: 'POST with Bearer token authorization',
    schedule: 'Every 6 hours',
    lastRun: new Date().toISOString()
  });
}
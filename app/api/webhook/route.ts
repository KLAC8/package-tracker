import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Package from '@/models/Package';
import { telegramBot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumber, status, events, source } = body;

    // Verify webhook source (add your own security here)
    if (source !== 'n8n') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized webhook source' },
        { status: 401 }
      );
    }

    await dbConnect();

    const packages = await Package.findOne({ trackingNumber });
    if (!packages) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    const oldStatus = packages.status;
    
    // Update package
    packages.status = status;
    if (events) {
      packages.events = events;
    }
    await packages.save();

    // Send notification if status changed
    if (oldStatus !== status && packages.notificationEnabled) {
      if (status === 'delivered') {
        await telegramBot.sendDeliveryNotification(
          trackingNumber,
          packages.description
        );
      } else {
        await telegramBot.sendPackageUpdate(
          trackingNumber,
          status,
          events?.[0]?.description || 'Status updated via webhook'
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Package updated successfully',
      data: packages 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
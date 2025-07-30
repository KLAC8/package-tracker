import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Package from '@/models/Package';
import { track17API } from '@/lib/17track';
import { telegramBot } from '@/lib/telegram';

export async function GET() {
  try {
    await dbConnect();
    const packages = await Package.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumber, carrier, description, telegramChatId } = body;

    if (!trackingNumber || !carrier) {
      return NextResponse.json(
        { success: false, error: 'Tracking number and carrier are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if package already exists
    const existingPackage = await Package.findOne({ trackingNumber });
    if (existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package already exists' },
        { status: 409 }
      );
    }

    // Register with 17Track
    const registered = await track17API.registerPackage(trackingNumber, carrier);
    if (!registered) {
      return NextResponse.json(
        { success: false, error: 'Failed to register package with tracking service' },
        { status: 500 }
      );
    }

    // Create package in database
    const newPackage = new Package({
      trackingNumber,
      carrier,
      description,
      telegramChatId,
      status: 'pending',
      events: []
    });

    await newPackage.save();

    // Send notification
    if (telegramChatId) {
      await telegramBot.sendMessage({
        chatId: telegramChatId,
        message: `📦 New package added for tracking!\n\n🔢 ${trackingNumber}\n🚚 ${carrier}${description ? `\n📝 ${description}` : ''}`
      });
    }

    return NextResponse.json({ success: true, data: newPackage });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    );
  }
}
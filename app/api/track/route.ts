import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Package from '@/models/Package';
import { track17API } from '@/lib/17track';
import { telegramBot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumbers } = body;

    if (!trackingNumbers || !Array.isArray(trackingNumbers)) {
      return NextResponse.json(
        { success: false, error: 'trackingNumbers array is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const results = [];

    for (const trackingNumber of trackingNumbers) {
      try {
        const trackingResponse = await track17API.getTrackingInfo(trackingNumber);
        
        if (trackingResponse.success && trackingResponse.data) {
          const packages = await Package.findOne({ trackingNumber });
          
          if (packages) {
            const oldStatus = packages.status;
            const newStatus = trackingResponse.data.status;
            
            // Update package with new information
            packages.status = newStatus;
            packages.events = trackingResponse.data.events;
            await packages.save();

            // Send notification if status changed
            if (oldStatus !== newStatus && packages.notificationEnabled) {
              if (newStatus === 'delivered') {
                await telegramBot.sendDeliveryNotification(
                  trackingNumber,
                  packages.description
                );
              } else {
                await telegramBot.sendPackageUpdate(
                  trackingNumber,
                  newStatus,
                  trackingResponse.data.events[0]?.description || 'Status updated'
                );
              }
            }

            results.push({
              trackingNumber,
              success: true,
              status: newStatus,
              events: trackingResponse.data.events
            });
          }
        } else {
          results.push({
            trackingNumber,
            success: false,
            error: trackingResponse.error || 'Failed to get tracking info'
          });
        }
      } catch (error) {
        console.error(`Error tracking ${trackingNumber}:`, error);
        results.push({
          trackingNumber,
          success: false,
          error: 'Tracking request failed'
        });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in bulk tracking:', error);
    return NextResponse.json(
      { success: false, error: 'Bulk tracking failed' },
      { status: 500 }
    );
  }
}
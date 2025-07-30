import mongoose, { Schema } from 'mongoose';
import { Package, TrackingEvent } from '@/types';

const TrackingEventSchema = new Schema<TrackingEvent>({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  location: { type: String },
  status: { type: String, required: true }
});

const PackageSchema = new Schema<Package>({
  trackingNumber: { type: String, required: true, unique: true },
  carrier: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'in_transit', 'delivered', 'exception', 'expired'],
    default: 'pending'
  },
  events: [TrackingEventSchema],
  telegramChatId: { type: String },
  notificationEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.Package || mongoose.model<Package>('Package', PackageSchema);
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  chatId: string;
  userId: number; 
  username?: string; 
  firstName?: string; 
  lastName?: string; 
  trackedPackages: string[]; 
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  chatId: { type: String, required: true, unique: true },
  userId: { type: Number, required: true, unique: true },
  username: { type: String, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  trackedPackages: { type: [String], default: [] },
  notificationsEnabled: { type: Boolean, default: true },
}, {
  timestamps: true // This automatically adds createdAt and updatedAt fields
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
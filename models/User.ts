import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  chatId: string;
  trackedPackages: string[]; // array of tracking numbers
  notificationsEnabled: boolean;
}

const UserSchema = new Schema<IUser>({
  chatId: { type: String, required: true, unique: true },
  trackedPackages: { type: [String], default: [] },
  notificationsEnabled: { type: Boolean, default: true },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

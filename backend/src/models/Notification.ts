import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  user: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'streak' | 'achievement' | 'roadmap' | 'quiz' | 'general';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['streak', 'achievement', 'roadmap', 'quiz', 'general'], 
      default: 'general' 
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);

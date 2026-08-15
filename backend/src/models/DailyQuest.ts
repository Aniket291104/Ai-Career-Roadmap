import { Schema, model, Document } from 'mongoose';

export interface IQuestItem {
  questType: 'check_in' | 'coding_challenge' | 'roadmap_task';
  title: string;
  description: string;
  xpReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface IDailyQuest extends Document {
  user: Schema.Types.ObjectId;
  dateStr: string; // YYYY-MM-DD
  quests: IQuestItem[];
  createdAt: Date;
  updatedAt: Date;
}

const DailyQuestSchema = new Schema<IDailyQuest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateStr: { type: String, required: true },
    quests: [
      {
        questType: { 
          type: String, 
          enum: ['check_in', 'coding_challenge', 'roadmap_task'], 
          required: true 
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        xpReward: { type: Number, required: true },
        isCompleted: { type: Boolean, default: false },
        isClaimed: { type: Boolean, default: false },
      }
    ]
  },
  { timestamps: true }
);

DailyQuestSchema.index({ user: 1, dateStr: 1 }, { unique: true });

export const DailyQuest = model<IDailyQuest>('DailyQuest', DailyQuestSchema);

import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  user: Schema.Types.ObjectId;
  roadmapId?: Schema.Types.ObjectId;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  category: 'learning' | 'coding' | 'project' | 'interview' | 'other';
  
  // Optional linkage to generated roadmap nodes
  monthRef?: number;
  weekRef?: number;
  dayRef?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap' },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: { 
      type: String, 
      enum: ['todo', 'in_progress', 'review', 'done'], 
      default: 'todo' 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
    dueDate: { type: Date },
    category: { 
      type: String, 
      enum: ['learning', 'coding', 'project', 'interview', 'other'], 
      default: 'learning' 
    },
    monthRef: { type: Number },
    weekRef: { type: Number },
    dayRef: { type: Number },
  },
  { timestamps: true }
);

TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, createdAt: -1 });

export const Task = model<ITask>('Task', TaskSchema);

import { Response } from 'express';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Progress } from '../models/Progress';
import { IAuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.enum(['learning', 'coding', 'project', 'interview', 'other']).default('learning'),
  dueDate: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum(['learning', 'coding', 'project', 'interview', 'other']).optional(),
  dueDate: z.string().optional().nullable(),
});

export class TaskController {
  
  static async getTasks(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
      res.status(200).json({ tasks });
    } catch (error) {
      console.error('Get Tasks Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async createTask(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      let dueDate: Date | undefined = undefined;
      if (parsed.data.dueDate && parsed.data.dueDate.trim() !== '') {
        const parsedDate = new Date(parsed.data.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate;
        }
      }

      const task = await Task.create({
        ...parsed.data,
        user: req.user.userId,
        dueDate,
      });

      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      console.error('Create Task Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async updateTask(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      const statusChangedToDone = parsed.data.status === 'done' && task.status !== 'done';

      // Update fields safely
      const updateData = { ...parsed.data };
      if (updateData.dueDate !== undefined) {
        if (updateData.dueDate && updateData.dueDate.trim() !== '') {
          const parsedDate = new Date(updateData.dueDate);
          updateData.dueDate = !isNaN(parsedDate.getTime()) ? (parsedDate as any) : null;
        } else {
          updateData.dueDate = null as any;
        }
      }

      Object.assign(task, updateData);
      await task.save();

      // Trigger gamification updates if status transitioned to done
      if (statusChangedToDone) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const user = await User.findById(req.user.userId);
        if (user) {
          let streakUpdated = false;
          const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
          if (lastActive) {
            lastActive.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today.getTime() - lastActive.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              user.currentStreak += 1;
              if (user.currentStreak > user.maxStreak) {
                user.maxStreak = user.currentStreak;
              }
              streakUpdated = true;
            } else if (diffDays > 1) {
              user.currentStreak = 1;
              streakUpdated = true;
            }
          } else {
            user.currentStreak = 1;
            user.maxStreak = 1;
            streakUpdated = true;
          }

          user.xpPoints += 15;
          user.lastActiveDate = new Date();
          await user.save();

          // Log progress activity heatmap
          let progress = await Progress.findOne({ user: user._id });
          if (!progress) {
            progress = await Progress.create({ user: user._id });
          }

          const existingActivity = progress.dailyActivity.find(
            (act) => new Date(act.date).toDateString() === today.toDateString()
          );

          if (existingActivity) {
            existingActivity.count += 1;
          } else {
            progress.dailyActivity.push({ date: today, count: 1 });
          }

          progress.xpHistory.push({ date: new Date(), points: 15 });

          const activitiesCount = progress.dailyActivity.length;
          progress.consistencyScore = Math.min(Math.round((activitiesCount / 30) * 100), 100);

          await progress.save();
        }
      }

      res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
      console.error('Update Task Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async deleteTask(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete Task Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

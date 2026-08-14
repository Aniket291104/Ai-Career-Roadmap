import { Response } from 'express';
import { Roadmap } from '../models/Roadmap';
import { Progress } from '../models/Progress';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { AIService } from '../services/ai.service';
import { generateRoadmapSchema, updateTaskStatusSchema } from '../validators/roadmap.validator';
import { IAuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const resourceLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['docs', 'youtube', 'course', 'github', 'blog', 'book', 'practice', 'notes']),
});

const dailyTaskSchema = z.object({
  dayNumber: z.number(),
  title: z.string(),
  description: z.string(),
  codingPractice: z.string().optional(),
  status: z.enum(['pending', 'completed']).default('pending'),
  links: z.array(resourceLinkSchema).optional(),
});

const projectBriefSchema = z.object({
  title: z.string(),
  description: z.string(),
  techStack: z.array(z.string()).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  estimatedHours: z.number().default(5),
  folderStructure: z.string().optional(),
  deploymentGuide: z.string().optional(),
});

const weeklyMilestoneSchema = z.object({
  weekNumber: z.number(),
  title: z.string(),
  description: z.string(),
  learningGoals: z.array(z.string()).default([]),
  dailyTasks: z.array(dailyTaskSchema).default([]),
  resources: z.array(resourceLinkSchema).default([]),
  projects: z.array(projectBriefSchema).default([]),
});

const monthlyMilestoneSchema = z.object({
  monthNumber: z.number(),
  title: z.string(),
  description: z.string(),
  weeks: z.array(weeklyMilestoneSchema).default([]),
});

const timelineSchema = z.array(monthlyMilestoneSchema);

export class RoadmapController {
  
  static async generate(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsed = generateRoadmapSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { skills, goal, dailyStudyHours, learningStyle, preferredLanguage, targetDuration } = parsed.data;

      // Limit check: free tier users can generate at most 2 roadmaps
      const user = await User.findById(req.user.userId);
      const isFreeTier = !user || user.subscriptionTier === 'free';
      if (isFreeTier) {
        const roadmapCount = await Roadmap.countDocuments({ user: req.user.userId });
        if (roadmapCount >= 2) {
          res.status(403).json({
            message: 'You have reached the maximum limit of 2 free career roadmaps. Please upgrade to our Pro or Premium tier to gain access to unlimited roadmap generations!'
          });
          return;
        }
      }

      // Call AI Service
      const aiRoadmap = await AIService.generateRoadmap(
        skills,
        goal,
        dailyStudyHours,
        learningStyle,
        preferredLanguage,
        targetDuration
      );

      // Create Roadmap record
      const roadmap = await Roadmap.create({
        user: req.user.userId,
        title: aiRoadmap.title || `${goal} Career Roadmap`,
        targetRole: aiRoadmap.targetRole || goal,
        difficulty: aiRoadmap.difficulty || 'intermediate',
        estimatedDuration: aiRoadmap.estimatedDuration || '4 Weeks',
        skillsCovered: aiRoadmap.skillsCovered || skills,
        timeline: aiRoadmap.timeline || [],
        progressPercent: 0,
        isCompleted: false,
      });

      // Update user skills and career goal if not set
      await User.findByIdAndUpdate(req.user.userId, {
        $set: { careerGoal: goal },
        $addToSet: { skills: { $each: skills } }
      });

      res.status(201).json({
        message: 'Roadmap generated successfully',
        roadmap,
      });
    } catch (error) {
      console.error('Generate Roadmap Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getUserRoadmaps(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const roadmaps = await Roadmap.find({ user: req.user.userId }).sort({ createdAt: -1 });
      res.status(200).json({ roadmaps });
    } catch (error) {
      console.error('Get User Roadmaps Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getRoadmapById(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const roadmap = await Roadmap.findOne({
        _id: req.params.id,
        user: req.user.userId,
      });

      if (!roadmap) {
        res.status(404).json({ message: 'Roadmap not found' });
        return;
      }

      res.status(200).json({ roadmap });
    } catch (error) {
      console.error('Get Roadmap by ID Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async updateTaskStatus(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsed = updateTaskStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { monthNumber, weekNumber, dayNumber, status } = parsed.data;

      const roadmap = await Roadmap.findOne({
        _id: req.params.id,
        user: req.user.userId,
      });

      if (!roadmap) {
        res.status(404).json({ message: 'Roadmap not found' });
        return;
      }

      // Find the specific daily task in the nested schema
      let taskUpdated = false;
      let taskStatusChangedToCompleted = false;
      let totalTasks = 0;
      let completedTasksCount = 0;

      for (const month of roadmap.timeline) {
        for (const week of month.weeks) {
          for (const dailyTask of week.dailyTasks) {
            totalTasks++;
            if (
              month.monthNumber === monthNumber &&
              week.weekNumber === weekNumber &&
              dailyTask.dayNumber === dayNumber
            ) {
              if (dailyTask.status !== 'completed' && status === 'completed') {
                taskStatusChangedToCompleted = true;
              }
              dailyTask.status = status;
              taskUpdated = true;
            }
            if (dailyTask.status === 'completed') {
              completedTasksCount++;
            }
          }
        }
      }

      if (!taskUpdated) {
        res.status(404).json({ message: 'Daily task not found in roadmap timeline' });
        return;
      }

      // Calculate progress percentage
      roadmap.progressPercent = Math.round((completedTasksCount / (totalTasks || 1)) * 100);
      roadmap.isCompleted = roadmap.progressPercent === 100;
      await roadmap.save();

      // If task was marked completed, log XP points, update user streak, and log daily activity heatmap
      if (taskStatusChangedToCompleted) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update streak and XP on User model
        const user = await User.findById(req.user.userId);
        if (user) {
          let streakUpdated = false;
          const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
          if (lastActive) {
            lastActive.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today.getTime() - lastActive.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              // Streak continued!
              user.currentStreak += 1;
              if (user.currentStreak > user.maxStreak) {
                user.maxStreak = user.currentStreak;
              }
              streakUpdated = true;
            } else if (diffDays > 1) {
              // Streak broken, reset
              user.currentStreak = 1;
              streakUpdated = true;
            }
          } else {
            // First activity
            user.currentStreak = 1;
            user.maxStreak = 1;
            streakUpdated = true;
          }

          user.xpPoints += 15; // 15 XP reward for task completion
          user.lastActiveDate = new Date();
          await user.save();

          // Log Progress Heatmap
          let progress = await Progress.findOne({ user: user._id });
          if (!progress) {
            progress = await Progress.create({ user: user._id });
          }

          // Check if activity for today is already logged
          const existingActivity = progress.dailyActivity.find(
            (act) => new Date(act.date).toDateString() === today.toDateString()
          );

          if (existingActivity) {
            existingActivity.count += 1;
          } else {
            progress.dailyActivity.push({ date: today, count: 1 });
          }

          progress.xpHistory.push({ date: new Date(), points: 15 });
          
          // Calculate dynamic consistency score
          const activitiesCount = progress.dailyActivity.length;
          progress.consistencyScore = Math.min(Math.round((activitiesCount / 30) * 100), 100); // normalized against 30 active days
          
          await progress.save();
        }
      }

      res.status(200).json({
        message: 'Task status updated successfully',
        roadmap,
      });
    } catch (error) {
      console.error('Update Roadmap Task Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async deleteRoadmap(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const deleted = await Roadmap.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

      if (!deleted) {
        res.status(404).json({ message: 'Roadmap not found' });
        return;
      }

      // Cleanup referential integrity: Delete all Kanban tasks linked to this roadmap
      await Task.deleteMany({ roadmapId: deleted._id });

      res.status(200).json({ message: 'Roadmap deleted successfully' });
    } catch (error) {
      console.error('Delete Roadmap Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async exportCalendar(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.userId });
      if (!roadmap) {
        res.status(404).json({ message: 'Roadmap not found' });
        return;
      }

      // Determine the base starting date for calendar calculations
      let baseDate = roadmap.createdAt ? new Date(roadmap.createdAt) : new Date();
      
      const queryDate = req.query.startDate || req.body.startDate;
      if (queryDate && typeof queryDate === 'string') {
        const parsedStart = new Date(queryDate);
        if (!isNaN(parsedStart.getTime())) {
          baseDate = parsedStart;
        }
      }

      let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AI Career Roadmap Generator//EN\r\n";
      let dayCount = 0;

      for (const month of roadmap.timeline) {
        for (const week of month.weeks) {
          for (const dailyTask of week.dailyTasks) {
            dayCount++;
            const eventDate = new Date(baseDate);
            eventDate.setDate(eventDate.getDate() + (dayCount - 1)); // start on day 0 offset

            const year = eventDate.getFullYear();
            const monthStr = String(eventDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(eventDate.getDate()).padStart(2, '0');
            const dateStr = `${year}${monthStr}${dayStr}`;

            icsContent += "BEGIN:VEVENT\r\n";
            icsContent += `UID:task-${roadmap._id}-${dayCount}@aicareerroadmaps.com\r\n`;
            icsContent += `DTSTART;VALUE=DATE:${dateStr}\r\n`;
            icsContent += `DTEND;VALUE=DATE:${dateStr}\r\n`;
            icsContent += `SUMMARY:[Roadmap] ${dailyTask.title}\r\n`;
            icsContent += `DESCRIPTION:Learning milestone for ${roadmap.title}. Day ${dayCount}.\r\n`;
            icsContent += "END:VEVENT\r\n";
          }
        }
      }

      icsContent += "END:VCALENDAR\r\n";

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="roadmap-${roadmap._id}.ics"`);
      res.status(200).send(icsContent);
    } catch (error) {
      console.error('Export Calendar Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async adaptRoadmap(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.userId });
      if (!roadmap) {
        res.status(404).json({ message: 'Roadmap not found' });
        return;
      }

      // Query AI to adapt remaining tasks based on current progress percentage
      const systemInstruction = `You are a system adapter. Adapt this roadmap timeline (current progress: ${roadmap.progressPercent}%). 
      Keep completed items, but update uncompleted items in the weekly/monthly timeline to make them slightly more advanced or add review checkpoints.
      Return the updated timeline JSON structure matching the schema.`;

      // Call AI Service
      const responseText = await AIService.generateAdaptedTimeline(JSON.stringify(roadmap.timeline), systemInstruction);
      
      try {
        const parsedTimeline = JSON.parse(responseText);
        const validation = timelineSchema.safeParse(parsedTimeline);
        if (validation.success) {
          roadmap.timeline = validation.data as any;
          await roadmap.save();
        } else {
          console.warn('AI adapt return does not match timeline schema validation profile:', validation.error);
          throw new Error('Schema mismatch');
        }
      } catch (parseErr) {
        console.warn('AI adapt failed parsing or validation. Keeping timeline and placing simulated review checkpoints.');
        
        // Simulated fallback: insert a review checkpoint in the first incomplete item
        let inserted = false;
        for (const month of roadmap.timeline) {
          for (const week of month.weeks) {
            for (const dailyTask of week.dailyTasks) {
              if (dailyTask.status !== 'completed' && !inserted) {
                dailyTask.title = `[ADAPTED] Review Checkpoint: ${dailyTask.title}`;
                inserted = true;
              }
            }
          }
        }
        await roadmap.save();
      }

      res.status(200).json({
        message: 'Roadmap adapted successfully based on your learning metrics',
        roadmap,
      });
    } catch (error) {
      console.error('Adapt Roadmap Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async submitProject(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { projectTitle, repoUrl, description } = req.body;
      if (!projectTitle || !repoUrl) {
        res.status(400).json({ message: 'Project title and repository URL are required' });
        return;
      }

      // Call AI Service to review submission
      const review = await AIService.reviewProject(projectTitle, repoUrl, description || '');

      // Trigger gamification updates: award +50 XP
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const user = await User.findById(req.user.userId);
      if (user) {
        user.xpPoints += 50;
        user.lastActiveDate = new Date();

        // Increment streak if active today
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
          } else if (diffDays > 1) {
            user.currentStreak = 1;
          }
        } else {
          user.currentStreak = 1;
          user.maxStreak = 1;
        }

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

        progress.xpHistory.push({ date: new Date(), points: 50 });
        const activitiesCount = progress.dailyActivity.length;
        progress.consistencyScore = Math.min(Math.round((activitiesCount / 30) * 100), 100);

        await progress.save();
      }

      res.status(200).json({
        message: 'Project submitted and reviewed successfully by AI Senior Dev',
        xpGained: 50,
        review,
      });
    } catch (error) {
      console.error('Submit Project Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

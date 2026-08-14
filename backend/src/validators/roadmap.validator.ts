import { z } from 'zod';

export const generateRoadmapSchema = z.object({
  skills: z.array(z.string()).min(1, 'Please specify at least one skill'),
  goal: z.string().min(2, 'Please specify your target career goal'),
  dailyStudyHours: z.number().min(1).max(24).default(2),
  learningStyle: z.enum(['visual', 'practical', 'theoretical', 'mixed']).default('mixed'),
  preferredLanguage: z.string().default('English'),
  targetDuration: z.number().min(1).max(12).default(3),
});

export const updateTaskStatusSchema = z.object({
  monthNumber: z.number(),
  weekNumber: z.number(),
  dayNumber: z.number(),
  status: z.enum(['pending', 'completed']),
});

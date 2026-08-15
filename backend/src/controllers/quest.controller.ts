import { Response } from 'express';
import { IAuthRequest } from '../middlewares/auth.middleware';
import { DailyQuest } from '../models/DailyQuest';
import { User } from '../models/User';

export class QuestController {
  /**
   * Fetches daily quests for today, initializing them if they don't exist.
   * Auto-completes the "check_in" quest on fetch since they visited the app.
   */
  static async getDaily(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const userId = req.user.userId;
      const todayStr = new Date().toISOString().split('T')[0];

      let dailyQuest = await DailyQuest.findOne({ user: userId, dateStr: todayStr });

      if (!dailyQuest) {
        dailyQuest = await DailyQuest.create({
          user: userId,
          dateStr: todayStr,
          quests: [
            {
              questType: 'check_in',
              title: 'Daily Check-in',
              description: 'Visit the dashboard to claim your daily check-in XP.',
              xpReward: 10,
              isCompleted: true, // auto-completed on dashboard visit
              isClaimed: false,
            },
            {
              questType: 'roadmap_task',
              title: 'Roadmap Explorer',
              description: 'Mark at least one learning task or sub-task as completed in your roadmap.',
              xpReward: 30,
              isCompleted: false,
              isClaimed: false,
            },
            {
              questType: 'coding_challenge',
              title: 'Coding Sandbox Champ',
              description: 'Run and compile code for any challenge in the coding sandbox.',
              xpReward: 50,
              isCompleted: false,
              isClaimed: false,
            },
          ],
        });
      } else {
        // Auto-complete check-in if not already completed
        const checkInQuest = dailyQuest.quests.find((q) => q.questType === 'check_in');
        if (checkInQuest && !checkInQuest.isCompleted) {
          checkInQuest.isCompleted = true;
          await dailyQuest.save();
        }
      }

      res.status(200).json({
        message: 'Daily quests retrieved successfully.',
        quests: dailyQuest.quests,
      });
    } catch (error) {
      console.error('Get Daily Quests Error:', error);
      res.status(500).json({ message: 'Internal Server Error fetching daily quests.' });
    }
  }

  /**
   * Claims the XP reward for a completed daily quest.
   */
  static async claimQuestXP(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const userId = req.user.userId;
      const { questType } = req.body;

      if (!questType) {
        res.status(400).json({ message: 'questType is required.' });
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const dailyQuest = await DailyQuest.findOne({ user: userId, dateStr: todayStr });

      if (!dailyQuest) {
        res.status(404).json({ message: 'Daily quests not found for today.' });
        return;
      }

      const quest = dailyQuest.quests.find((q) => q.questType === questType);

      if (!quest) {
        res.status(404).json({ message: 'Quest type not found.' });
        return;
      }

      if (!quest.isCompleted) {
        res.status(400).json({ message: 'Quest is not completed yet.' });
        return;
      }

      if (quest.isClaimed) {
        res.status(400).json({ message: 'Quest XP has already been claimed.' });
        return;
      }

      // Claim reward
      quest.isClaimed = true;
      await dailyQuest.save();

      // Award XP to user
      const user = await User.findById(userId);
      if (user) {
        user.xpPoints += quest.xpReward;
        await user.save();
      }

      res.status(200).json({
        message: `Successfully claimed +${quest.xpReward} XP!`,
        quests: dailyQuest.quests,
        xpPoints: user ? user.xpPoints : 0,
      });
    } catch (error) {
      console.error('Claim Quest XP Error:', error);
      res.status(500).json({ message: 'Internal Server Error claiming quest XP.' });
    }
  }

  /**
   * Static helper for other controllers to complete quests programmatically.
   */
  static async completeQuest(userId: string, questType: 'check_in' | 'coding_challenge' | 'roadmap_task'): Promise<void> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let dailyQuest = await DailyQuest.findOne({ user: userId, dateStr: todayStr });

      if (!dailyQuest) {
        // Create initial quests
        dailyQuest = await DailyQuest.create({
          user: userId,
          dateStr: todayStr,
          quests: [
            {
              questType: 'check_in',
              title: 'Daily Check-in',
              description: 'Visit the dashboard to claim your daily check-in XP.',
              xpReward: 10,
              isCompleted: false,
              isClaimed: false,
            },
            {
              questType: 'roadmap_task',
              title: 'Roadmap Explorer',
              description: 'Mark at least one learning task or sub-task as completed in your roadmap.',
              xpReward: 30,
              isCompleted: false,
              isClaimed: false,
            },
            {
              questType: 'coding_challenge',
              title: 'Coding Sandbox Champ',
              description: 'Run and compile code for any challenge in the coding sandbox.',
              xpReward: 50,
              isCompleted: false,
              isClaimed: false,
            },
          ],
        });
      }

      const quest = dailyQuest.quests.find((q) => q.questType === questType);
      if (quest && !quest.isCompleted) {
        quest.isCompleted = true;
        await dailyQuest.save();
      }
    } catch (err) {
      console.error('Failed to auto-complete quest:', err);
    }
  }
}

import { Response } from 'express';
import { Quiz } from '../models/Quiz';
import { User } from '../models/User';
import { Progress } from '../models/Progress';
import { AIService } from '../services/ai.service';
import { IAuthRequest } from '../middlewares/auth.middleware';

export class QuizController {
  
  static async generate(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const skills = req.body.skills && Array.isArray(req.body.skills) && req.body.skills.length > 0
        ? req.body.skills
        : (user.skills.length > 0 ? user.skills : ['Programming']);
      const goal = req.body.goal && typeof req.body.goal === 'string'
        ? req.body.goal
        : (user.careerGoal || 'Software Engineer');

      // Generate questions via AI Service
      const questions = await AIService.generateQuiz(skills, goal);

      // Save to database
      const quiz = await Quiz.create({
        user: req.user.userId,
        category: `${goal} Skill Assessment`,
        questions,
        scorePercent: 0,
        isCompleted: false,
      });

      // Filter out answers before responding to client
      const sanitizedQuestions = quiz.questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        topic: q.topic,
      }));

      res.status(201).json({
        message: 'Quiz generated successfully',
        quizId: quiz._id,
        category: quiz.category,
        questions: sanitizedQuestions,
      });
    } catch (error) {
      console.error('Generate Quiz Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async submit(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { quizId, answers } = req.body; // answers: Array of numbers mapping to index
      if (!quizId || !Array.isArray(answers)) {
        res.status(400).json({ message: 'quizId and answers array are required' });
        return;
      }

      const quiz = await Quiz.findOne({ _id: quizId, user: req.user.userId });
      if (!quiz) {
        res.status(404).json({ message: 'Quiz not found' });
        return;
      }

      if (quiz.isCompleted) {
        res.status(400).json({ message: 'Quiz has already been submitted and scored' });
        return;
      }

      if (answers.length !== quiz.questions.length) {
        res.status(400).json({ message: 'Mismatch between answer count and quiz question count' });
        return;
      }

      let correctCount = 0;
      const strongAreas = new Set<string>();
      const weakAreas = new Set<string>();

      // Grade questions
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const userAnswer = answers[i];
        
        question.userAnswerIndex = userAnswer;

        if (userAnswer === question.correctAnswerIndex) {
          correctCount++;
          strongAreas.add(question.topic);
        } else {
          weakAreas.add(question.topic);
        }
      }

      // Calculate final score
      const totalQuestions = quiz.questions.length;
      quiz.scorePercent = Math.round((correctCount / totalQuestions) * 100);
      
      // Clean up sets
      weakAreas.forEach((w) => strongAreas.delete(w)); // if they got it wrong in one but right in another, it is a weak area
      quiz.strongAreas = Array.from(strongAreas);
      quiz.weakAreas = Array.from(weakAreas);
      quiz.isCompleted = true;

      await quiz.save();

      // Award XP
      const user = await User.findById(req.user.userId);
      if (user) {
        user.xpPoints += 50; // 50 XP reward for completing quiz assessment
        await user.save();
      }

      // Update radar charts metrics on progress
      let progress = await Progress.findOne({ user: req.user.userId });
      if (!progress) {
        progress = await Progress.create({ user: req.user.userId });
      }

      // Map quiz scores to radar chart topics e.g. Frontend, Backend
      // For simplicity, we assign scorePercent to subject
      const subject = user?.careerGoal || 'Coding';
      const existingMetric = progress.radarMetrics.find(m => m.subject === subject);
      if (existingMetric) {
        existingMetric.score = Math.round((existingMetric.score + quiz.scorePercent) / 2);
      } else {
        progress.radarMetrics.push({ subject, score: quiz.scorePercent });
      }
      await progress.save();

      res.status(200).json({
        message: 'Quiz evaluated successfully',
        scorePercent: quiz.scorePercent,
        strongAreas: quiz.strongAreas,
        weakAreas: quiz.weakAreas,
        questions: quiz.questions, // return questions WITH correct indexes + explanations now
      });
    } catch (error) {
      console.error('Submit Quiz Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getHistory(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const quizzes = await Quiz.find({ user: req.user.userId, isCompleted: true }).sort({ createdAt: -1 });
      res.status(200).json({ quizzes });
    } catch (error) {
      console.error('Get Quiz History Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

import { Response } from 'express';
import { Portfolio } from '../models/Portfolio';
import { AIService } from '../services/ai.service';
import { IAuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

import axios from 'axios';

const analyzePortfolioSchema = z.object({
  githubUrl: z.string().url('Invalid URL format').includes('github.com', { message: 'Must be a GitHub URL' }),
});

export class PortfolioController {
  
  static async analyze(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsed = analyzePortfolioSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { githubUrl } = parsed.data;
      const cleanUrl = githubUrl.replace(/\/$/, '');
      
      let username = 'developer';
      try {
        const urlObj = new URL(githubUrl);
        const paths = urlObj.pathname.split('/').filter(Boolean);
        if (paths.length > 0) {
          username = paths[0];
        }
      } catch (e) {
        username = cleanUrl.split('/').pop() || 'developer';
      }

      let reposList: any[] = [];
      let aggregatedLanguages: { [key: string]: number } = {};

      try {
        // Query GitHub API
        const headers: any = {
          'User-Agent': 'AI-Career-Roadmap-Generator-Server',
        };
        if (process.env.GITHUB_TOKEN) {
          headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        let page = 1;
        let keepFetching = true;
        let allGithubRepos: any[] = [];

        while (keepFetching) {
          const githubRes = await axios.get(
            `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`,
            { headers }
          );

          if (Array.isArray(githubRes.data) && githubRes.data.length > 0) {
            allGithubRepos = allGithubRepos.concat(githubRes.data);
            if (githubRes.data.length < 100) {
              keepFetching = false;
            } else {
              page++;
            }
          } else {
            keepFetching = false;
          }
        }

        if (allGithubRepos.length > 0) {
          reposList = allGithubRepos.map((repo: any) => ({
            name: repo.name,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            primaryLanguage: repo.language || 'HTML/CSS',
            hasReadme: !!repo.description, // Simple readme proxy
          }));

          // Calculate language percentages
          allGithubRepos.forEach((repo: any) => {
            if (repo.language) {
              aggregatedLanguages[repo.language] = (aggregatedLanguages[repo.language] || 0) + 1;
            }
          });
        }
      } catch (githubErr: any) {
        console.warn('GitHub API failed:', githubErr.response?.data || githubErr.message);
      }

      // Run AI scanner
      const analysis = await AIService.analyzePortfolio(githubUrl, reposList);

      // Overwrite analysis parameters with real GitHub API data if available
      const finalLanguages = reposList.length > 0 
        ? Object.entries(aggregatedLanguages).map(([name, count]) => ({
            name,
            percentage: Math.round((count / reposList.length) * 100),
          }))
        : analysis.languages;

      const finalRepos = reposList.length > 0 ? reposList : analysis.repositories;

      // Create DB record
      const portfolioAnalysis = await Portfolio.create({
        user: req.user.userId,
        githubUrl: analysis.githubUrl,
        reposCount: reposList.length > 0 ? reposList.length : analysis.reposCount,
        languages: finalLanguages,
        repositories: finalRepos,
        portfolioScore: analysis.portfolioScore,
        readmeQuality: analysis.readmeQuality,
        commitActivity: analysis.commitActivity,
        suggestions: analysis.suggestions,
      });

      res.status(200).json({
        message: 'Portfolio analyzed successfully',
        analysis: portfolioAnalysis,
      });
    } catch (error) {
      console.error('Portfolio Analysis Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getHistory(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const history = await Portfolio.find({ user: req.user.userId }).sort({ createdAt: -1 });
      res.status(200).json({ history });
    } catch (error) {
      console.error('Get Portfolio History Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

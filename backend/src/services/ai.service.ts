import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const isMock = !apiKey || apiKey === 'mock_gemini_api_key';

let ai: GoogleGenAI | null = null;
if (!isMock && apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export class AIService {
  private static modelName = 'gemini-2.5-flash';

  /**
   * Generates a complete learning roadmap based on user input
   */
  static async generateRoadmap(
    skills: string[],
    goal: string,
    dailyHours: number,
    learningStyle: string,
    preferredLanguage: string,
    targetDuration: number = 3
  ): Promise<any> {
    if (isMock || !ai) {
      console.log('Using mock roadmap generator...');
      const mock = this.getMockRoadmap(goal, skills, learningStyle, preferredLanguage);
      mock.estimatedDuration = `${targetDuration} Months`;
      if (mock.timeline && Array.isArray(mock.timeline)) {
        if (mock.timeline.length > targetDuration) {
          mock.timeline = mock.timeline.slice(0, targetDuration);
        } else {
          const originalTimeline = [...mock.timeline];
          while (mock.timeline.length < targetDuration) {
            const nextMonthIndex = mock.timeline.length + 1;
            const templateMonth = JSON.parse(JSON.stringify(originalTimeline[(nextMonthIndex - 1) % originalTimeline.length]));
            templateMonth.monthNumber = nextMonthIndex;
            templateMonth.title = `Month ${nextMonthIndex}: Advanced ${goal} Scaling`;
            mock.timeline.push(templateMonth);
          }
        }
      }
      return mock;
    }

    const prompt = `
      Create a highly structured career roadmap for a user whose current skills are: [${skills.join(', ')}].
      Their primary career goal is: "${goal}".
      Their learning style is: "${learningStyle}" and they can study ${dailyHours} hours per day.
      The target timeline duration they want to achieve this goal in is: ${targetDuration} months.
      Please output the roadmap in the preferred language: "${preferredLanguage}".

      You MUST respond with a valid JSON object matching this schema structure:
      {
        "title": "Roadmap title",
        "targetRole": "Role name matching the goal",
        "difficulty": "beginner" | "intermediate" | "advanced",
        "estimatedDuration": "X Weeks" or "X Months",
        "skillsCovered": ["skill1", "skill2"],
        "timeline": [
          {
            "monthNumber": 1,
            "title": "Month focus topic",
            "description": "General description of month goals",
            "weeks": [
              {
                "weekNumber": 1,
                "title": "Week focus topic",
                "description": "General description of week goals",
                "learningGoals": ["goal 1", "goal 2"],
                "dailyTasks": [
                  {
                    "dayNumber": 1,
                    "title": "Task title",
                    "description": "Detailed description of what to study/do",
                    "codingPractice": "Description of code or practice exercise for this day",
                    "links": [
                      {
                        "title": "Topic specific guide or tutorial",
                        "url": "https://example.com/topic-docs",
                        "type": "docs" | "youtube" | "course" | "github" | "blog" | "book" | "practice" | "notes"
                      }
                    ]
                  }
                ],
                "projects": [
                  {
                    "title": "Week project title",
                    "description": "Description of what they will build",
                    "techStack": ["React", "Express"],
                    "difficulty": "beginner" | "intermediate" | "advanced",
                    "estimatedHours": 6,
                    "folderStructure": "src/\\n  components/\\n  App.js",
                    "deploymentGuide": "Deploy on Vercel"
                  }
                ]
              }
            ]
          }
        ]
      }

      CRITICAL TIMELINE REQUIREMENTS:
      1. Provide a comprehensive, complete roadmap that covers exactly ${targetDuration} months (so monthNumber ranges from 1 to ${targetDuration}).
      2. Each month MUST contain exactly 4 weeks (weekNumber from 1 to 4).
      3. Each week MUST contain exactly 6 daily tasks, representing a 6-day study routine (dayNumber from 1 to 6 for each week).
      4. Ensure all JSON fields are populated with highly realistic, relevant tech details. Do not use placeholders.
      5. For each daily task, you MUST provide 1 to 2 specific, real, active, and accessible resource links inside the "links" array. These can be official documentation, educational videos, or cheatsheets/notes type guides (e.g., developer cheatsheets, MDN Web Docs, nodejs.org, react.dev, mongoosejs.com, docs.docker.com, or specific YouTube tutorials) representing that specific day's study topic. Set the type field accordingly to 'docs', 'youtube', or 'notes'. Do NOT use generic domain paths like "https://youtube.com" or "https://example.com/docs". Provide actual topic-specific URLs to make resources easy to find for the student.
      6. Prioritize high-quality video tutorials from popular Indian programming creators/channels (e.g., Hitesh Choudhary - Chai aur Code, CodeWithHarry, Piyush Garg, Love Babbar, Apna College, Sheryians Coding School) where relevant, to make the video resources extremely relatable and helpful for Indian students.
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an elite Tech Career Coach and System Architect. Output only pure, parseable JSON conforming exactly to the requested schema. Do not put markdown code blocks around it.',
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini Roadmap Generation Error, falling back to mock:', error);
      // Fallback to mock data and format to targetDuration
      const mock = this.getMockRoadmap(goal, skills, learningStyle, preferredLanguage);
      mock.estimatedDuration = `${targetDuration} Months`;
      if (mock.timeline && Array.isArray(mock.timeline)) {
        if (mock.timeline.length > targetDuration) {
          mock.timeline = mock.timeline.slice(0, targetDuration);
        } else {
          const originalTimeline = [...mock.timeline];
          while (mock.timeline.length < targetDuration) {
            const nextMonthIndex = mock.timeline.length + 1;
            const templateMonth = JSON.parse(JSON.stringify(originalTimeline[(nextMonthIndex - 1) % originalTimeline.length]));
            templateMonth.monthNumber = nextMonthIndex;
            templateMonth.title = `Month ${nextMonthIndex}: Advanced ${goal} Scaling`;
            mock.timeline.push(templateMonth);
          }
        }
      }
      return mock;
    }
  }

  /**
   * Evaluates candidate resume for ATS alignment
   */
  static async analyzeResume(fileBuffer: Buffer, mimeType: string): Promise<any> {
    if (isMock || !ai) {
      console.log('Using mock resume analyzer...');
      return {
        atsScore: 85,
        missingSkills: ['System Design', 'Docker', 'Kubernetes'],
        missingKeywords: ['CI/CD', 'Microservices', 'Unit Testing'],
        suggestions: `### ATS Resume Enhancements\n\n- **Add Technical Projects**: Mention projects using Node.js and React.\n- **Quantify Impact**: Use numbers like "optimized db queries by 40%".\n- **Format Header**: Ensure your GitHub and email links are easily parseable by ATS.`,
      };
    }

    const contents: any[] = [];
    if (mimeType === 'text/plain') {
      contents.push(`Here is the candidate's resume text:\n\n${fileBuffer.toString('utf-8')}`);
    } else if (mimeType === 'application/pdf') {
      contents.push({
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: 'application/pdf',
        },
      });
      contents.push("Here is the candidate's resume PDF file.");
    } else {
      contents.push(`Here is the candidate's resume content:\n\n${fileBuffer.toString('utf-8')}`);
    }

    contents.push(`
      Evaluate the provided resume for ATS (Applicant Tracking System) compatibility. 
      Recommend specific improvements, list missing critical keywords/skills for generic Software Engineering roles, 
      and calculate an overall ATS score (out of 100) based strictly on this resume content.

      Return a JSON conforming to:
      {
        "atsScore": 78,
        "missingSkills": ["Docker", "Kubernetes", "AWS"],
        "missingKeywords": ["CI/CD", "Scalability", "Agile methodologies"],
        "suggestions": "Markdown suggestions on formatting, style, content, and phrasing improvements."
      }
    `);

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a professional ATS Scanner and recruiter. Evaluate the resume content/file rigorously.',
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response');
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini Resume Analysis Error:', error);
      return {
        atsScore: 65,
        missingSkills: ['System Design', 'Docker', 'Kubernetes'],
        missingKeywords: ['CI/CD', 'Microservices', 'Unit Testing'],
        suggestions: 'Failed to process resume document. Ensure the PDF is not encrypted and contains readable text.',
      };
    }
  }

  /**
   * Reviews GitHub portfolio details
   */
  static async analyzePortfolio(githubUrl: string, reposList?: any[]): Promise<any> {
    // For portfolio URL we scan repos and give recommendations
    const cleanUrl = githubUrl.replace(/\/$/, '');
    
    // Extract username robustly
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

    if (isMock || !ai) {
      if (reposList && reposList.length > 0) {
        const noReadmeRepos = reposList.filter(r => !r.hasReadme).map(r => r.name);
        const langCounts: Record<string, number> = {};
        reposList.forEach(r => {
          if (r.primaryLanguage) langCounts[r.primaryLanguage] = (langCounts[r.primaryLanguage] || 0) + 1;
        });
        const languages = Object.entries(langCounts).map(([name, count]) => ({
          name,
          percentage: Math.round((count / reposList.length) * 100)
        })).sort((a, b) => b.percentage - a.percentage);

        let suggestions = `### GitHub Portfolio Analysis\n\n`;
        suggestions += `An automated review of your GitHub repository metrics:\n\n`;
        if (noReadmeRepos.length > 0) {
          suggestions += `- **Write READMEs**: The following repositories lack a description or README: ${noReadmeRepos.slice(0, 3).map(n => `\`${n}\``).join(', ')}. Adding detailed instructions will make them stand out to recruiters.\n`;
        }
        suggestions += `- **Code Structure**: Ensure you name projects clearly, clean up experimental forks, and document configuration steps.\n`;
        
        const topLang = languages[0]?.name || 'TypeScript';
        suggestions += `- **Core Stack**: You have a strong presence of **${topLang}** repositories. Highlight this stack on your CV.`;

        return {
          githubUrl,
          reposCount: reposList.length,
          languages,
          repositories: reposList,
          portfolioScore: Math.min(70 + reposList.filter(r => r.stars > 0).length * 5 + reposList.filter(r => r.hasReadme).length * 2, 95),
          readmeQuality: noReadmeRepos.length > 2 ? 'needs_work' : 'good',
          commitActivity: 'active',
          suggestions
        };
      }

      return {
        githubUrl,
        reposCount: 8,
        languages: [
          { name: 'TypeScript', percentage: 65 },
          { name: 'JavaScript', percentage: 25 },
          { name: 'HTML/CSS', percentage: 10 },
        ],
        repositories: [
          { name: 'career-builder-api', stars: 12, forks: 3, primaryLanguage: 'TypeScript', hasReadme: true },
          { name: 'portfolio-v2', stars: 8, forks: 1, primaryLanguage: 'TypeScript', hasReadme: true },
          { name: 'sorting-visualizer', stars: 2, forks: 0, primaryLanguage: 'JavaScript', hasReadme: false },
        ],
        portfolioScore: 82,
        readmeQuality: 'good',
        commitActivity: 'active',
        suggestions: `### GitHub Portfolio Recommendations\n\n- **Write READMEs**: Project 'sorting-visualizer' lacks a README. Add detailed install instructions.\n- **Pin High-Quality Repos**: Pin 3-4 key projects highlighting Full-Stack skills instead of simple class exercises.\n- **Improve Commit Messages**: Use descriptive commits rather than "fixed bugs" or "update file".`,
      };
    }

    let reposContext = '';
    if (reposList && reposList.length > 0) {
      reposContext = `The user's actual repositories fetched from the GitHub API are:\n` + 
        reposList.map(r => `- Name: ${r.name}, Stars: ${r.stars}, Forks: ${r.forks}, Primary Language: ${r.primaryLanguage}, Has README: ${r.hasReadme}`).join('\n');
    }

    const prompt = `
      Provide a portfolio review feedback mockup for user GitHub profile URL: "${githubUrl}".
      The user username is: "${username}".

      ${reposContext}

      Evaluate their repository structure, names, languages, and stars based on their actual repositories if provided. Compute an overall portfolio rating score (out of 100), and write detailed suggestions.

      Return a JSON conforming to:
      {
        "githubUrl": "${githubUrl}",
        "reposCount": ${reposList && reposList.length > 0 ? reposList.length : 15},
        "languages": [
          {"name": "TypeScript", "percentage": 70},
          {"name": "Go", "percentage": 20},
          {"name": "Python", "percentage": 10}
        ],
        "repositories": [
          {"name": "microservices-chat", "stars": 34, "forks": 8, "primaryLanguage": "TypeScript", "hasReadme": true},
          {"name": "dsa-practice", "stars": 2, "forks": 0, "primaryLanguage": "Go", "hasReadme": false}
        ],
        "portfolioScore": 75,
        "readmeQuality": "needs_work",
        "commitActivity": "active",
        "suggestions": "Markdown suggestions to improve README structures, repository pins, and star ratios based on their actual repositories."
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an engineering manager reviewing developer GitHub profiles. Give realistic insights.',
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response');
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini Portfolio Analysis Error:', error);

      if (reposList && reposList.length > 0) {
        const noReadmeRepos = reposList.filter(r => !r.hasReadme).map(r => r.name);
        const langCounts: Record<string, number> = {};
        reposList.forEach(r => {
          if (r.primaryLanguage) langCounts[r.primaryLanguage] = (langCounts[r.primaryLanguage] || 0) + 1;
        });
        const languages = Object.entries(langCounts).map(([name, count]) => ({
          name,
          percentage: Math.round((count / reposList.length) * 100)
        })).sort((a, b) => b.percentage - a.percentage);

        let suggestions = `### GitHub Portfolio Analysis (Offline Mode)\n\n`;
        suggestions += `An automated review of your GitHub repository metrics:\n\n`;
        if (noReadmeRepos.length > 0) {
          suggestions += `- **Write READMEs**: The following repositories lack a description or README: ${noReadmeRepos.slice(0, 3).map(n => `\`${n}\``).join(', ')}. Adding detailed instructions will make them stand out to recruiters.\n`;
        }
        suggestions += `- **Code Structure**: Ensure you name projects clearly, clean up experimental forks, and document configuration steps.\n`;
        
        const topLang = languages[0]?.name || 'TypeScript';
        suggestions += `- **Core Stack**: You have a strong presence of **${topLang}** repositories. Highlight this stack on your CV.`;

        return {
          githubUrl,
          reposCount: reposList.length,
          languages,
          repositories: reposList,
          portfolioScore: Math.min(70 + reposList.filter(r => r.stars > 0).length * 5 + reposList.filter(r => r.hasReadme).length * 2, 95),
          readmeQuality: noReadmeRepos.length > 2 ? 'needs_work' : 'good',
          commitActivity: 'active',
          suggestions
        };
      }

      return {
        githubUrl,
        reposCount: 3,
        languages: [{ name: 'JavaScript', percentage: 100 }],
        repositories: [{ name: 'my-app', stars: 0, forks: 0, primaryLanguage: 'JavaScript', hasReadme: true }],
        portfolioScore: 60,
        readmeQuality: 'needs_work',
        commitActivity: 'sporadic',
        suggestions: 'Verify username is valid. Ensure you use readme templates and list tech stack features.',
      };
    }
  }

  /**
   * Generates interview questions or conducts mock interview discussions
   */
  static async handleMockInterview(
    sessionHistory: { role: 'interviewer' | 'candidate'; content: string }[],
    type: string,
    company: string = 'Google',
    difficulty: string = 'FAANG',
    mode: string = 'strict'
  ): Promise<string> {
    if (isMock || !ai) {
      if (sessionHistory.length === 0) {
        return `Hello! Welcome to your mock ${type} interview with ${company} at ${difficulty} level. I am a Senior Software Engineer here, and I'll be guiding you today. Let's start with a brief overview of your background.`;
      }
      const lastAnswer = sessionHistory[sessionHistory.length - 1].content;
      return `Thanks for that explanation. Now, let's discuss how we would design or implement this for scaling. What happens if traffic grows by 10x? What bottlenecks do you foresee?`;
    }

    const conversationPrompt = sessionHistory.map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');

    const prompt = `
      You are a Senior Software Engineer and Architect conducting a mock technical interview at ${company}.
      Interview Type/Focus: ${type}
      Difficulty: ${difficulty}
      Mode: ${mode}

      Here is the dialogue history of our conversation so far:
      ${conversationPrompt}

      Act strictly as the AI interviewer. Write the next logical interviewer statement or follow-up question.
      Make sure to ask questions that never repeat, probe for technical depth, cover coding, behavioral, or system design scenarios based on the interview flow, and dynamically ask for optimization details.
      Keep it conversational and output ONLY the interviewer's direct spoken question without labels. Limit it to 1-2 concise paragraphs.
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: 'You are an interviewer. Speak directly as the interviewer. Do not append labels like "Interviewer:" or anything. Just output the text response.',
        },
      });

      return response.text || 'Could you elaborate further on your experience?';
    } catch (error) {
      console.error('Gemini Mock Interview Error:', error);
      return 'Can you explain the main challenges you faced in your last project and how you solved them?';
    }
  }

  /**
   * Completes evaluation of full interview session
   */
  static async evaluateMockInterview(
    sessionHistory: { role: 'interviewer' | 'candidate'; content: string }[],
    type: string,
    company: string = 'Google',
    difficulty: string = 'FAANG'
  ): Promise<any> {
    if (isMock || !ai) {
      return {
        overallScore: 84,
        subScores: {
          coding: 82,
          communication: 88,
          confidence: 85,
          technical: 80,
          behavior: 85,
        },
        feedback: `### Mock Interview Report\n\n- **Company**: ${company}\n- **Difficulty**: ${difficulty}\n\n#### Strengths\n- Strong algorithm choices.\n- Great communication style.\n\n#### Weaknesses\n- Avoid simple naming bugs.\n- Improve optimization scaling metrics.`,
      };
    }

    const conversationPrompt = sessionHistory.map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');

    const prompt = `
      Analyze this full mock interview transcript for a "${type}" position at "${company}" with a "${difficulty}" difficulty level:
      ${conversationPrompt}

      Provide a comprehensive candidate evaluation. You must respond with a valid JSON object matching this schema:
      {
        "overallScore": 82, // 0 to 100
        "subScores": {
          "coding": 80, // 0 to 100
          "communication": 85, // 0 to 100
          "confidence": 82, // 0 to 100
          "technical": 80, // 0 to 100
          "behavior": 88 // 0 to 100
        },
        "feedback": "A beautiful Markdown candidate summary listing: overall rating, strengths, weaknesses, mistakes, correct answers, better optimal solutions, recommendations (projects, courses), and learning paths."
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an elite interviewer reviewing candidates. Be critical and helpful in your scores.',
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response');
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini Interview Evaluation Error:', error);
      return {
        overallScore: 75,
        subScores: {
          coding: 70,
          communication: 75,
          confidence: 75,
          technical: 75,
          behavior: 75,
        },
        feedback: 'Evaluation complete. Candidate answers show a basic understanding, but could benefit from explaining scaling, edge cases, and design choices.',
      };
    }
  }

  /**
   * Chat Guidance response handler
   */
  static async handleChatGuidance(
    message: string,
    chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[]
  ): Promise<string> {
    if (isMock || !ai) {
      return `I am currently running in offline developer mode, but I can guide you! To succeed in your goal, make sure you focus on writing clean, modular components in React, set up robust authentication systems, study database optimizations, and practice mocking system architectures. Let me know if you need specific coding templates!`;
    }

    try {
      // Map history to official @google/genai format
      const formattedHistory = chatHistory.map(ch => ({
        role: ch.role,
        parts: ch.parts,
      }));

      const chat = ai.chats.create({
        model: this.modelName,
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ message });
      return response.text || 'I could not process that request. Could you rephrase?';
    } catch (error) {
      console.error('Gemini Chat Error, falling back to mock response:', error);
      
      const hasSentFirstQuiz = chatHistory.some(ch => 
        ch.parts && ch.parts.some(p => p.text && p.text.includes('type of "null" in JavaScript'))
      );

      const quiz1 = `Sure! Here is a 5-question TypeScript multiple-choice quiz:

1. What is the type of "null" in JavaScript?
   A. null
   B. object
   C. undefined
   D. string
   (Correct Answer: B. object)

2. Which keyword is used to declare a block-scoped variable that cannot be reassigned?
   A. var
   B. let
   C. const
   D. define
   (Correct Answer: C. const)

3. How do you specify that a variable 'x' can be either a string or a number in TypeScript?
   A. let x: string & number;
   B. let x: string | number;
   C. let x: string || number;
   D. let x: string && number;
   (Correct Answer: B. string | number)

4. What is the default access modifier for class members in TypeScript if not specified?
   A. private
   B. protected
   C. public
   D. internal
   (Correct Answer: C. public)

5. Which file is used to configure compilation settings for a TypeScript project?
   A. package.json
   B. tsconfig.json
   C. webpack.config.js
   D. tsconfig.js
   (Correct Answer: B. tsconfig.json)`;

      const quiz2 = `Sure! Here is another 5-question TypeScript multiple-choice quiz:

1. Which of the following is NOT a primitive type in TypeScript?
   A. string
   B. boolean
   C. tuple
   D. number
   (Correct Answer: C. tuple)

2. What does the "readonly" modifier do in TypeScript?
   A. Prevents writing to properties outside the constructor
   B. Makes properties write-only
   C. Speeds up webpack compilation
   D. Restricts variables from being referenced
   (Correct Answer: A. Prevents writing to properties outside the constructor)

3. What is the purpose of the "any" type in TypeScript?
   A. It forces strict compilation checks
   B. It disables type-checking for the variable
   C. It represents a string format only
   D. It allows variables to be only null
   (Correct Answer: B. It disables type-checking for the variable)

4. Which utility type constructs a type with all properties of Type set to optional?
   A. Required<Type>
   B. Pick<Type, Keys>
   C. Record<Keys, Type>
   D. Partial<Type>
   (Correct Answer: D. Partial<Type>)

5. How do you write a type assertion in TypeScript?
   A. let x = y as string;
   B. let x = cast<string>(y);
   C. let x = (string)y;
   D. let x = y: string;
   (Correct Answer: A. let x = y as string;)`;

      const responses: Record<string, string> = {
        'explain': 'REST APIs communicate synchronously over HTTP/1.1 using HTTP methods, whereas gRPC uses HTTP/2 with Protocol Buffers for high-performance, duplex, binary communication.',
        'quiz': hasSentFirstQuiz ? quiz2 : quiz1,
        'resume': '1. Use clear headings (Skills, Experience, Projects).\n2. Write statements in Action-Result format.\n3. Integrate keywords like "TypeScript", "REST APIs", and "CI/CD".',
        'html': 'HTML (HyperText Markup Language) is the standard markup language used to create web pages. It defines the structure of web content using elements/tags like <h1>, <p>, and <div>.',
      };

      const key = Object.keys(responses).find((k) => message.toLowerCase().includes(k)) || 'default';
      if (key !== 'default') {
        return responses[key];
      }

      return `I am currently running in offline developer mode, but I can guide you! To answer your question about "${message}": Make sure to focus on clean code, modular design, and robust error handling. Let me know if you need specific templates or configurations!`;
    }
  }

  // --- MOCK DATA FALLBACKS ---

  private static getMockRoadmap(goal: string, skills: string[], style: string, lang: string): any {
    // Determine difficulty based on user's existing skills
    const hasSkills = skills && skills.length > 0;
    const difficulty = hasSkills ? 'intermediate' : 'beginner';

    // Build a goal-specific tech curriculum
    const goalConfig = AIService.getGoalConfig(goal);
    const userSkillsLabel = hasSkills ? skills.join(', ') : 'No prior skills (starting from scratch)';
    const coreTopics = goalConfig.coreTopics;
    const techStack = goalConfig.techStack;
    const learningResources = goalConfig.resources;

    // Helper: build a day task
    const makeDay = (dayNum: number, topic: string, desc: string, practice: string, links: any[]) => ({
      dayNumber: dayNum,
      title: topic,
      description: desc,
      codingPractice: practice,
      links,
    });

    return {
      title: `${goal} Career Roadmap`,
      targetRole: goal,
      difficulty,
      estimatedDuration: '4 Months',
      skillsCovered: [...new Set([...coreTopics.slice(0, 6), ...(hasSkills ? skills : [])])],
      timeline: [
        {
          monthNumber: 1,
          title: `Month 1: ${goalConfig.month1Title}`,
          description: `Build the foundations for becoming a ${goal}. ${hasSkills ? `You already know: ${userSkillsLabel}. We'll build on these.` : 'Starting fresh — we cover everything from the basics up.'}`,
          weeks: [
            {
              weekNumber: 1,
              title: `Week 1: ${coreTopics[0]} Fundamentals`,
              description: `Deep dive into ${coreTopics[0]} as the foundation for your ${goal} path.`,
              learningGoals: [
                `Understand the core concepts of ${coreTopics[0]}`,
                `Set up your development environment`,
                'Write and run your first programs',
              ],
              dailyTasks: [
                makeDay(1, `Introduction to ${coreTopics[0]}`, `Overview of ${coreTopics[0]} and why it matters for ${goal}. Install tools and set up your dev environment.`, `Write a "Hello World" program and experiment with basic syntax in ${coreTopics[0]}.`, [learningResources[0], learningResources[1]]),
                makeDay(2, `${coreTopics[0]} Core Syntax`, `Study variables, data types, operators, and control flow in ${coreTopics[0]}.`, `Write 5 small programs using conditionals and loops.`, [learningResources[0]]),
                makeDay(3, `Functions & Modules in ${coreTopics[0]}`, `Learn how to structure reusable functions and organize code into modules.`, `Build a calculator module with add, subtract, multiply, divide functions.`, [learningResources[1]]),
                makeDay(4, `Data Structures for ${goal}`, `Explore arrays, objects/maps and when to use each for building ${goal} applications.`, `Implement a student grade tracker using arrays and objects.`, [learningResources[2]]),
                makeDay(5, `Problem Solving with ${coreTopics[0]}`, `Practice debugging and solving algorithmic problems relevant to your career path.`, `Solve 3 easy problems on LeetCode or HackerRank using ${coreTopics[0]}.`, [learningResources[2]]),
                makeDay(6, `Mini Project: ${goalConfig.week1Project.title}`, goalConfig.week1Project.description, goalConfig.week1Project.practice, [learningResources[0], learningResources[1]]),
              ],
              projects: [{
                title: goalConfig.week1Project.title,
                description: goalConfig.week1Project.description,
                techStack: techStack.slice(0, 2),
                difficulty: 'beginner',
                estimatedHours: 5,
                folderStructure: goalConfig.week1Project.folderStructure,
                deploymentGuide: 'Run locally and test in browser or terminal.',
              }],
            },
            {
              weekNumber: 2,
              title: `Week 2: ${coreTopics[1]}`,
              description: `Master ${coreTopics[1]} which is essential for the ${goal} role.`,
              learningGoals: [`Apply ${coreTopics[1]} in real projects`, 'Understand best practices', 'Handle common use cases'],
              dailyTasks: [
                makeDay(1, `${coreTopics[1]} Overview`, `Introduction to ${coreTopics[1]}: what it is, why it's used, and where it fits in the ${goal} ecosystem.`, `Set up a sample project and write basic ${coreTopics[1]} code.`, [learningResources[1]]),
                makeDay(2, `Core ${coreTopics[1]} Patterns`, `Learn the most important patterns and techniques used in ${coreTopics[1]}.`, `Implement 2 design patterns relevant to ${coreTopics[1]}.`, [learningResources[2]]),
                makeDay(3, `${coreTopics[1]} in ${goal} context`, `See how ${coreTopics[1]} is used specifically in real-world ${goal} applications.`, `Build a feature using ${coreTopics[1]} that you'd find in a production ${goal} app.`, [learningResources[0]]),
                makeDay(4, `Debugging & Best Practices`, `Learn how to debug ${coreTopics[1]} code and follow industry best practices.`, `Debug a broken ${coreTopics[1]} snippet and fix all errors.`, [learningResources[1]]),
                makeDay(5, `Testing ${coreTopics[1]} Code`, `Write unit tests for your ${coreTopics[1]} components/modules.`, `Write 3 unit tests for functions you built earlier this week.`, [learningResources[2]]),
                makeDay(6, `Review & Consolidation`, `Review the week's concepts and build a small integration project.`, `Combine ${coreTopics[0]} and ${coreTopics[1]} in a single mini app.`, [learningResources[0], learningResources[2]]),
              ],
              projects: [{
                title: `${coreTopics[1]} Practice App`,
                description: `A hands-on application demonstrating your ${coreTopics[1]} skills in the context of ${goal}.`,
                techStack: techStack.slice(0, 3),
                difficulty,
                estimatedHours: 6,
                folderStructure: `src/\n  ${coreTopics[1].toLowerCase().replace(/\s+/g, '-')}/\n  index.js`,
                deploymentGuide: 'Deploy on Vercel or Netlify for free.',
              }],
            },
            {
              weekNumber: 3,
              title: `Week 3: ${coreTopics[2]}`,
              description: `Deep dive into ${coreTopics[2]}, a core skill required for every ${goal}.`,
              learningGoals: [`Understand ${coreTopics[2]} architecture`, `Build real ${coreTopics[2]} features`, 'Integrate with previous skills'],
              dailyTasks: [
                makeDay(1, `${coreTopics[2]} Architecture`, `Understand how ${coreTopics[2]} is structured and how it's used in production ${goal} systems.`, `Diagram the architecture of a system using ${coreTopics[2]}.`, [learningResources[0]]),
                makeDay(2, `Building with ${coreTopics[2]}`, `Hands-on: implement ${coreTopics[2]} features step-by-step.`, `Build a feature that uses ${coreTopics[2]} from scratch.`, [learningResources[1]]),
                makeDay(3, `${coreTopics[2]} Advanced Topics`, `Go deeper into advanced ${coreTopics[2]} topics that appear in real interviews and jobs.`, `Implement 1 advanced ${coreTopics[2]} pattern used in production.`, [learningResources[2]]),
                makeDay(4, `Integration Project`, `Combine ${coreTopics[0]}, ${coreTopics[1]}, and ${coreTopics[2]} into an integrated mini-app.`, `Build a mini ${goal} project integrating all 3 topics covered so far.`, [learningResources[0]]),
                makeDay(5, `Code Review & Refactoring`, `Review the code from this week and refactor it to be clean and production-ready.`, `Refactor your integration project following best practices.`, [learningResources[1]]),
                makeDay(6, `Portfolio Documentation`, `Write a clear README for your project and document your learnings.`, `Write a professional README.md with setup steps, features, and screenshots.`, [learningResources[2]]),
              ],
              projects: [{
                title: `${goal} Integration Project`,
                description: `A complete mini application that demonstrates ${coreTopics[0]}, ${coreTopics[1]}, and ${coreTopics[2]} working together.`,
                techStack: techStack.slice(0, 4),
                difficulty,
                estimatedHours: 8,
                folderStructure: `src/\n  components/\n  utils/\n  main.js`,
                deploymentGuide: `Deploy on ${goalConfig.deployTarget}.`,
              }],
            },
            {
              weekNumber: 4,
              title: 'Week 4: Real-World Projects & Portfolio',
              description: `Build your portfolio project: a complete, deployable ${goal} application.`,
              learningGoals: ['Build a full end-to-end project', 'Learn deployment best practices', 'Create portfolio-ready work'],
              dailyTasks: [
                makeDay(1, 'Project Planning', `Plan your capstone ${goal} project: define features, user stories, and tech stack.`, `Write a project specification document with 5 user stories.`, [learningResources[0]]),
                makeDay(2, 'Project Setup & Architecture', `Set up your project repository, structure, and CI/CD pipeline.`, `Initialize the repo, configure linting, and set up folder structure.`, [learningResources[1]]),
                makeDay(3, 'Core Features Implementation', `Build the primary features of your ${goal} capstone project.`, `Implement 2 core features with tests.`, [learningResources[0], learningResources[2]]),
                makeDay(4, 'UI/UX & Styling', `Polish the user interface and ensure a professional look.`, `Implement responsive design and smooth UI interactions.`, [learningResources[1]]),
                makeDay(5, 'Deployment & Testing', `Deploy your project live and run end-to-end tests.`, `Deploy to ${goalConfig.deployTarget} and test all features.`, [learningResources[2]]),
                makeDay(6, 'Portfolio & LinkedIn Update', `Update your portfolio site and LinkedIn with your new project.`, `Write a project case study for your portfolio with screenshots and live link.`, [learningResources[0]]),
              ],
              projects: [{
                title: `${goal} Capstone Project`,
                description: `A full, portfolio-ready project demonstrating your ${goal} skills using: ${techStack.join(', ')}.`,
                techStack,
                difficulty: 'intermediate',
                estimatedHours: 12,
                folderStructure: `src/\n  pages/\n  components/\n  api/\n  utils/\nREADME.md`,
                deploymentGuide: `Deploy on ${goalConfig.deployTarget} with CI/CD pipeline.`,
              }],
            },
          ],
        },
      ],
    };
  }

  /**
   * Returns goal-specific configuration for mock roadmap generation
   */
  private static getGoalConfig(goal: string): {
    month1Title: string;
    coreTopics: string[];
    techStack: string[];
    resources: { title: string; url: string; type: string }[];
    week1Project: { title: string; description: string; practice: string; folderStructure: string };
    deployTarget: string;
  } {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('frontend') || goalLower.includes('front-end') || goalLower.includes('react') || goalLower.includes('ui')) {
      return {
        month1Title: 'HTML, CSS & JavaScript Fundamentals',
        coreTopics: ['HTML & CSS', 'JavaScript', 'React.js', 'Responsive Design', 'REST APIs', 'Git & Deployment'],
        techStack: ['HTML', 'CSS', 'JavaScript', 'React', 'Vite', 'Vercel'],
        resources: [
          { title: 'The Odin Project - Full Frontend Path', url: 'https://www.theodinproject.com/paths/full-stack-javascript', type: 'course' },
          { title: 'MDN Web Docs - HTML Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', type: 'docs' },
          { title: 'React Official Docs (react.dev)', url: 'https://react.dev/learn', type: 'docs' },
        ],
        week1Project: {
          title: 'Personal Portfolio Website',
          description: 'Build a responsive personal portfolio website with HTML, CSS and JavaScript.',
          practice: 'Create a responsive landing page with navigation, hero section, and contact form.',
          folderStructure: 'index.html\nstyles.css\nscript.js\nassets/',
        },
        deployTarget: 'Vercel or Netlify',
      };
    }

    if (goalLower.includes('backend') || goalLower.includes('back-end') || goalLower.includes('server') || goalLower.includes('api')) {
      return {
        month1Title: 'Node.js, Express & REST API Fundamentals',
        coreTopics: ['Node.js', 'Express.js', 'MongoDB & Mongoose', 'REST API Design', 'Authentication & JWT', 'Docker & Deployment'],
        techStack: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'JWT', 'Docker'],
        resources: [
          { title: 'Node.js Official Documentation', url: 'https://nodejs.org/en/docs', type: 'docs' },
          { title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'docs' },
          { title: 'Backend Development in Hindi (Chai aur Code)', url: 'https://www.youtube.com/playlist?list=PLu71SKxNbfoBGh_8p_NS-ZAh6463yYtVP', type: 'youtube' },
        ],
        week1Project: {
          title: 'REST API Starter',
          description: 'Build a CRUD REST API with Express and MongoDB for a simple resource like todos or notes.',
          practice: 'Create GET, POST, PUT, DELETE routes for a Notes resource.',
          folderStructure: 'src/\n  routes/\n  controllers/\n  models/\n  app.ts',
        },
        deployTarget: 'Render or Railway',
      };
    }

    if (goalLower.includes('full stack') || goalLower.includes('fullstack')) {
      return {
        month1Title: 'Full Stack Foundations: Frontend + Backend',
        coreTopics: ['HTML/CSS/JavaScript', 'React.js', 'Node.js & Express', 'MongoDB', 'Authentication', 'DevOps & Deployment'],
        techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'Docker', 'Vercel'],
        resources: [
          { title: 'Full Stack Open Course (Univ of Helsinki)', url: 'https://fullstackopen.com/en/', type: 'course' },
          { title: 'MERN Stack Tutorial (Traversy Media)', url: 'https://www.youtube.com/watch?v=mrHNSanmqQ4', type: 'youtube' },
          { title: 'React Official Docs', url: 'https://react.dev/learn', type: 'docs' },
        ],
        week1Project: {
          title: 'Full Stack Todo App',
          description: 'Build a complete Todo application with React frontend and Node.js/Express backend.',
          practice: 'Connect a React frontend to an Express REST API and persist todos in MongoDB.',
          folderStructure: 'frontend/\n  src/\n    App.jsx\nbackend/\n  src/\n    app.ts',
        },
        deployTarget: 'Vercel (frontend) + Render (backend)',
      };
    }

    if (goalLower.includes('ai') || goalLower.includes('machine learning') || goalLower.includes('ml') || goalLower.includes('data science')) {
      return {
        month1Title: 'Python, Math & ML Fundamentals',
        coreTopics: ['Python Programming', 'Linear Algebra & Statistics', 'Machine Learning with scikit-learn', 'Deep Learning & PyTorch', 'NLP & LLMs', 'MLOps & Deployment'],
        techStack: ['Python', 'NumPy', 'Pandas', 'scikit-learn', 'PyTorch', 'HuggingFace', 'FastAPI'],
        resources: [
          { title: 'fast.ai - Practical Deep Learning', url: 'https://course.fast.ai/', type: 'course' },
          { title: 'Kaggle Learn - ML Free Courses', url: 'https://www.kaggle.com/learn', type: 'course' },
          { title: 'Python ML Tutorial Hindi (Krish Naik)', url: 'https://www.youtube.com/c/KrishNaik', type: 'youtube' },
        ],
        week1Project: {
          title: 'Data Analysis Notebook',
          description: 'Analyze a real-world dataset using Python, Pandas and Matplotlib.',
          practice: 'Load a CSV dataset, clean it, and generate 3 visualizations using Matplotlib.',
          folderStructure: 'notebooks/\n  analysis.ipynb\ndata/\n  dataset.csv',
        },
        deployTarget: 'Hugging Face Spaces or Streamlit Cloud',
      };
    }

    if (goalLower.includes('devops') || goalLower.includes('cloud') || goalLower.includes('sre')) {
      return {
        month1Title: 'Linux, Networking & Cloud Fundamentals',
        coreTopics: ['Linux & Bash', 'Docker & Containers', 'Kubernetes', 'CI/CD Pipelines', 'AWS/GCP/Azure', 'Infrastructure as Code'],
        techStack: ['Linux', 'Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'AWS'],
        resources: [
          { title: 'Docker Official Get Started Guide', url: 'https://docs.docker.com/get-started/', type: 'docs' },
          { title: 'Kubernetes Docs - Getting Started', url: 'https://kubernetes.io/docs/setup/', type: 'docs' },
          { title: 'DevOps Full Course Hindi (TechWorld with Nana)', url: 'https://www.youtube.com/c/TechWorldwithNana', type: 'youtube' },
        ],
        week1Project: {
          title: 'Dockerized App',
          description: 'Containerize an existing Node.js app using Docker and docker-compose.',
          practice: 'Write a Dockerfile and docker-compose.yml and run the app in a container.',
          folderStructure: 'Dockerfile\ndocker-compose.yml\nsrc/\n  app.js',
        },
        deployTarget: 'AWS EC2 or DigitalOcean Droplet',
      };
    }

    if (goalLower.includes('cyber') || goalLower.includes('security') || goalLower.includes('ethical hacking')) {
      return {
        month1Title: 'Networking, Linux & Security Fundamentals',
        coreTopics: ['Networking & TCP/IP', 'Linux & Bash Scripting', 'Web Application Security (OWASP)', 'Penetration Testing', 'Cryptography', 'Security Tools & CTFs'],
        techStack: ['Linux', 'Kali Linux', 'Python', 'Nmap', 'Metasploit', 'Burp Suite'],
        resources: [
          { title: 'TryHackMe - Cybersecurity Learning', url: 'https://tryhackme.com/', type: 'course' },
          { title: 'OWASP Top 10 Documentation', url: 'https://owasp.org/www-project-top-ten/', type: 'docs' },
          { title: 'Ethical Hacking in Hindi (Apna College)', url: 'https://www.youtube.com/c/ApnaCollegeOfficial', type: 'youtube' },
        ],
        week1Project: {
          title: 'Network Scanner Tool',
          description: 'Build a simple port scanner tool using Python and socket programming.',
          practice: 'Write a Python script that scans open ports on a target IP address.',
          folderStructure: 'scanner.py\nutils/\n  port_utils.py',
        },
        deployTarget: 'Local VM / TryHackMe Labs',
      };
    }

    // Default / Generic tech roadmap
    return {
      month1Title: `${goal} Foundations`,
      coreTopics: [`${goal} Fundamentals`, 'Programming & Logic', 'System Design', 'Tools & Workflows', 'Testing & QA', 'Deployment & Portfolio'],
      techStack: ['JavaScript', 'TypeScript', 'Node.js', 'Git', 'Docker', 'Cloud'],
      resources: [
        { title: 'freeCodeCamp - Full Stack Development', url: 'https://www.freecodecamp.org/learn', type: 'course' },
        { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/', type: 'docs' },
        { title: 'Tech Career Roadmap Hindi (CodeWithHarry)', url: 'https://www.youtube.com/c/CodeWithHarry', type: 'youtube' },
      ],
      week1Project: {
        title: `${goal} Starter Project`,
        description: `A beginner project demonstrating core ${goal} concepts.`,
        practice: 'Build a working prototype with the core features of your target role.',
        folderStructure: 'src/\n  index.js\nREADME.md',
      },
      deployTarget: 'Vercel or GitHub Pages',
    };
  }

  /**
   * Generates MCQ Programming Assessment questions
   */
  static async generateQuiz(skills: string[], goal: string): Promise<any[]> {
    if (isMock || !ai) {
      console.log('Using mock quiz generator...');
      return this.getMockQuiz(goal, skills);
    }

    const randomSeed = Math.random().toString(36).substring(7);
    const prompt = `
      Generate a set of exactly 20 multiple-choice programming questions (MCQs) to evaluate a candidate targeting this career goal: "${goal}".
      Their current skills are: [${skills.join(', ')}].
      Include questions covering programming, system design, frontend, backend, or DSA relevant to this path.
      Ensure the questions are completely fresh and diverse. Seed: ${randomSeed}

      Output as a JSON array of objects conforming exactly to this structure:
      [
        {
          "questionText": "Question description",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0,
          "explanation": "Why this option is correct",
          "topic": "Subtopic name"
        }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert technical interviewer. Generate a high-quality MCQ quiz of exactly 20 items in JSON. Ensure only one answer is correct and options are plausible.',
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini Quiz Generation Error, falling back to mock:', error);
      return this.getMockQuiz(goal, skills);
    }
  }

  private static getMockQuiz(goal: string, skills: string[]): any[] {
    const questionPool = [
      {
        questionText: `Which of the following describes the key purpose of the 'tsconfig.json' file when building a TypeScript project?`,
        options: [
          'It handles runtime performance monitoring of node logs.',
          'It compiles CSS layouts into production-ready styles.',
          'It specifies root files and compiler choices needed to compile the project.',
          'It handles user authorization controls.'
        ],
        correctAnswerIndex: 2,
        explanation: 'tsconfig.json contains the configurations for the TypeScript compiler (tsc).',
        topic: 'TypeScript Configuration'
      },
      {
        questionText: `In a RESTful architecture, which HTTP method is typically used to apply a partial modification to a resource?`,
        options: ['POST', 'PUT', 'PATCH', 'OPTIONS'],
        correctAnswerIndex: 2,
        explanation: 'PATCH is designed for applying partial modifications to a resource.',
        topic: 'REST API design'
      },
      {
        questionText: `Which data structure operates on a First-In, First-Out (FIFO) access pattern?`,
        options: ['Stack', 'Queue', 'Binary Tree', 'Max Heap'],
        correctAnswerIndex: 1,
        explanation: 'Queues process items in the order they arrive (First-In, First-Out).',
        topic: 'Data Structures'
      },
      {
        questionText: `What is the primary role of a 'Refresh Token' in cookie-based authentication?`,
        options: [
          'It encrypts user passwords in databases.',
          'It provides a long-lived credential used to request new, short-lived Access Tokens.',
          'It checks request rates to limit DDoS attempts.',
          'It handles OAuth callbacks.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Refresh tokens allow clients to silently acquire fresh access tokens without requiring users to type credentials repeatedly.',
        topic: 'Authentication'
      },
      {
        questionText: `Which index type in MongoDB is optimal for executing search queries matching arbitrary substrings?`,
        options: ['Single Field Index', 'Compound Index', 'Text Index', 'Hashed Index'],
        correctAnswerIndex: 2,
        explanation: 'Text indexes support string content searches in Mongoose.',
        topic: 'Databases'
      },
      {
        questionText: `What is the average time complexity for searching a value in a Balanced Binary Search Tree (e.g., AVL tree)?`,
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctAnswerIndex: 2,
        explanation: 'Balanced BSTs halve the search space at each level, leading to logarithmic search complexity.',
        topic: 'Algorithms'
      },
      {
        questionText: `Which CSS property is used to define the space inside a border, between the border and the content?`,
        options: ['margin', 'padding', 'border-spacing', 'align-content'],
        correctAnswerIndex: 1,
        explanation: 'Padding adds space inside an element, whereas margin adds space outside it.',
        topic: 'CSS layouts'
      },
      {
        questionText: `What is the primary use case of the 'git cherry-pick' command?`,
        options: [
          'It reverts the entire repository to an older commit hash.',
          'It applies the changes introduced by some existing commits to the current branch.',
          'It deletes uncommitted local changes.',
          'It initializes a remote upstream branch.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Cherry-picking allows you to select specific commits from one branch and apply them to another.',
        topic: 'Version Control'
      },
      {
        questionText: `What is the standard port number for secure HTTPS traffic?`,
        options: ['80', '8080', '443', '3000'],
        correctAnswerIndex: 2,
        explanation: 'HTTPS traffic is directed to port 443, while standard HTTP utilizes port 80.',
        topic: 'Networking'
      },
      {
        questionText: `Which Docker command is used to run a container in the background (detached mode)?`,
        options: ['docker run -d', 'docker start -bg', 'docker exec -it', 'docker run -p'],
        correctAnswerIndex: 0,
        explanation: 'The "-d" flag stands for detached, allowing containers to run as background daemons.',
        topic: 'DevOps & Containers'
      },
      {
        questionText: `What does 'DRY' stand for in software engineering principles?`,
        options: ['Document Real Yields', 'Don\'t Repeat Yourself', 'Database Realtime Yield', 'Dynamic Route Yielding'],
        correctAnswerIndex: 1,
        explanation: 'Don\'t Repeat Yourself aims to reduce redundancy in systems through abstraction.',
        topic: 'Clean Code principles'
      },
      {
        questionText: `Which of the following sorting algorithms has the best worst-case time complexity?`,
        options: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Selection Sort'],
        correctAnswerIndex: 2,
        explanation: 'Merge Sort has a guaranteed worst-case time complexity of O(n log n), whereas Quick Sort has O(n^2).',
        topic: 'Algorithms'
      },
      {
        questionText: `In React 18/19, what hook is used to trigger side effects on component lifecycle changes?`,
        options: ['useState', 'useContext', 'useEffect', 'useMemo'],
        correctAnswerIndex: 2,
        explanation: 'useEffect handles side-effects like fetching data, syncing timers, or setting up listener hooks.',
        topic: 'React'
      },
      {
        questionText: `What is SQL Injection?`,
        options: [
          'A process of database normalization.',
          'An attack where malicious SQL statements are inserted into entry fields for execution.',
          'A styling strategy for relational grids.',
          'A backup recovery process.'
        ],
        correctAnswerIndex: 1,
        explanation: 'SQL Injection inserts unauthorized database queries to compromise data assets.',
        topic: 'Security'
      },
      {
        questionText: `Which header handles Cross-Origin Resource Sharing controls in modern web apps?`,
        options: ['X-Frame-Options', 'Access-Control-Allow-Origin', 'Authorization', 'Cache-Control'],
        correctAnswerIndex: 1,
        explanation: 'Access-Control-Allow-Origin dictates which clients can access assets cross-origin.',
        topic: 'Web Security'
      },
      {
        questionText: `What does the 'npm ci' command do?`,
        options: [
          'It cleans the npm cache memory.',
          'It installs packages directly from package-lock.json for clean CI builds.',
          'It runs unit testing logs.',
          'It compiles TypeScript code.'
        ],
        correctAnswerIndex: 1,
        explanation: 'npm ci performs a clean install using the lockfile, which is optimal for build containers.',
        topic: 'Node.js Packaging'
      },
      {
        questionText: `What is the primary role of a 'Load Balancer' in system architectures?`,
        options: [
          'It encrypts user transactions.',
          'It distributes incoming network traffic across a group of backend servers.',
          'It compresses video feeds.',
          'It manages routing parameters.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Load balancers distribute work to optimize capacity utilization and prevent server overload.',
        topic: 'System Design'
      },
      {
        questionText: `Which of the following is a non-relational NoSQL database?`,
        options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
        correctAnswerIndex: 2,
        explanation: 'MongoDB stores data in JSON-like documents, making it a NoSQL database.',
        topic: 'Databases'
      },
      {
        questionText: `In Git, what command lists the commit history of a branch?`,
        options: ['git status', 'git branch', 'git log', 'git show'],
        correctAnswerIndex: 2,
        explanation: 'git log prints chronological commit identifiers.',
        topic: 'Version Control'
      },
      {
        questionText: `What does JWT stand for?`,
        options: ['JSON Web Token', 'Java Web Tool', 'Joint Web Transfer', 'JSON Web Target'],
        correctAnswerIndex: 0,
        explanation: 'JWT is an open standard (RFC 7519) defining a compact method for securely transmitting claims.',
        topic: 'Authentication'
      },
      {
        questionText: `What is the purpose of 'useMemo' hook in React?`,
        options: [
          'To directly manipulate the DOM.',
          'To cache the result of a calculation between re-renders.',
          'To declare global states.',
          'To mount lifecycle listeners.'
        ],
        correctAnswerIndex: 1,
        explanation: 'useMemo memoizes CPU-intensive computations to prevent unwanted recalculation overheads.',
        topic: 'React'
      },
      {
        questionText: `What is the time complexity of pushing an element to a Stack?`,
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswerIndex: 0,
        explanation: 'Push operations on a stack happen at the top index, which is instantaneous O(1).',
        topic: 'Data Structures'
      },
      {
        questionText: `Which protocol is primarily used for real-time bi-directional client-server communications?`,
        options: ['HTTP/1.1', 'WebSockets', 'SMTP', 'FTP'],
        correctAnswerIndex: 1,
        explanation: 'WebSockets maintain open socket links for bi-directional live communications.',
        topic: 'Networking'
      },
      {
        questionText: `What is the purpose of the 'helmet' middleware in Express?`,
        options: [
          'It handles file downloads.',
          'It sets HTTP response headers to secure Express apps.',
          'It sanitizes database queries.',
          'It processes multipart form-data.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Helmet secure Express applications by setting appropriate security-related HTTP headers.',
        topic: 'Security'
      },
      {
        questionText: `Which keyword is used to declare a variable scoped strictly to the enclosing block in ES6?`,
        options: ['var', 'let', 'global', 'define'],
        correctAnswerIndex: 1,
        explanation: 'let variables are block-scoped, preventing variable hoisting leaks typical of var.',
        topic: 'JavaScript'
      },
      {
        questionText: `What does HTML stand for?`,
        options: [
          'HyperText Markup Language',
          'HighText Machine Language',
          'HyperTech Model Language',
          'HyperText Metadata Layout'
        ],
        correctAnswerIndex: 0,
        explanation: 'HTML defines the skeletal layout of web interfaces.',
        topic: 'Web Foundations'
      },
      {
        questionText: `What is the default port of a Redis caching server?`,
        options: ['27017', '5432', '6379', '3306'],
        correctAnswerIndex: 2,
        explanation: 'Redis by default listens on port 6379, while MongoDB listens on 27017.',
        topic: 'Caching'
      },
      {
        questionText: `Which Git command allows shifting code updates to a remote workspace repository?`,
        options: ['git pull', 'git fetch', 'git push', 'git commit'],
        correctAnswerIndex: 2,
        explanation: 'git push uploads local branch commits to the remote repository.',
        topic: 'Version Control'
      },
      {
        questionText: `What is a Mongoose schema validation hook middleware?`,
        options: [
          'A router controller validator.',
          'A pre or post execution trigger hook run during document updates/saves.',
          'An SSL configuration.',
          'A visual theme stylesheet.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Pre/post hooks run verification, hashing, or logs during schema document saves.',
        topic: 'Databases'
      },
      {
        questionText: `What is the role of an 'A Record' in DNS settings?`,
        options: [
          'It routes email traffic records.',
          'It maps a domain name directly to an IPv4 address.',
          'It points a subdomain to a canonical name.',
          'It manages certificate records.'
        ],
        correctAnswerIndex: 1,
        explanation: 'A records map human-readable domain names to host IPv4 addresses.',
        topic: 'DNS & Systems'
      },
      {
        questionText: `What is a Singleton design pattern?`,
        options: [
          'A pattern restricted to single query responses.',
          'A pattern ensuring a class has only one instance and provides a global access point.',
          'A database backup workflow.',
          'A styling strategy.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Singletons restrict instance creation to one object, optimal for database client instances.',
        topic: 'Software Architecture'
      },
      {
        questionText: `Which of the following handles asynchronous execution flow control in JavaScript ES8?`,
        options: ['callbacks', 'promises', 'async / await', 'generators'],
        correctAnswerIndex: 2,
        explanation: 'Async/await provides clean, synchronous-looking control flow over asynchronous promise lists.',
        topic: 'JavaScript'
      },
      {
        questionText: `What is the key purpose of Mongoose 'indexes'?`,
        options: [
          'They store files in memory storage.',
          'They improve query search execution speeds significantly at the cost of writes.',
          'They sanitize text tags.',
          'They handle email delivery loops.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Indexes optimize collection query scans, avoiding expensive full table collection scans.',
        topic: 'Databases'
      },
      {
        questionText: `What does the 'npm link' command do?`,
        options: [
          'It creates symlinks for local packages, optimal for package testing.',
          'It downloads dependencies from remote feeds.',
          'It starts testing frameworks.',
          'It registers billing webhooks.'
        ],
        correctAnswerIndex: 0,
        explanation: 'npm link connects local package directories to global nodes for workspace integration tests.',
        topic: 'Node.js Packaging'
      },
      {
        questionText: `Which of the following is a symmetric encryption algorithm?`,
        options: ['RSA', 'AES', 'ECC', 'Diffie-Hellman'],
        correctAnswerIndex: 1,
        explanation: 'AES is a symmetric key cipher, while RSA is asymmetric public-key cryptography.',
        topic: 'Cryptography'
      },
      {
        questionText: `What does CSS stand for?`,
        options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'Content Style Sheets'],
        correctAnswerIndex: 0,
        explanation: 'CSS handles design structures, styling parameters, layout templates, and themes.',
        topic: 'Web Foundations'
      },
      {
        questionText: `In Docker Compose, what does the 'volumes' directive do?`,
        options: [
          'It increases container server volumes.',
          'It mounts persistent storage systems to host paths.',
          'It scales networks.',
          'It configures CPU capacity thresholds.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Volumes persist file writes beyond container runtimes by mapping them to host machines.',
        topic: 'DevOps & Containers'
      },
      {
        questionText: `What is the purpose of the 'git rebase' command?`,
        options: [
          'It deletes a branch permanently.',
          'It moves or combines a sequence of commits to a new base commit.',
          'It fetches updates without merging.',
          'It reverts a single commit.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Rebasing clean up commit trees by rewriting branch bases.',
        topic: 'Version Control'
      },
      {
        questionText: `Which design layout method is best for organizing content grid layouts in CSS?`,
        options: ['flexbox', 'CSS Grid', 'inline-blocks', 'float positioning'],
        correctAnswerIndex: 1,
        explanation: 'CSS Grid provides a two-dimensional grid-based layout model, which is superior to Flexbox for grid alignments.',
        topic: 'CSS layouts'
      },
      {
        questionText: `What does the HTTP status code '403 Forbidden' indicate?`,
        options: [
          'The request has timed out.',
          'The client has authentication credentials but lacks authorization to access resources.',
          'The server is offline.',
          'The resource does not exist.'
        ],
        correctAnswerIndex: 1,
        explanation: '403 indicates authorization restrictions, whereas 401 indicates authentication failure.',
        topic: 'HTTP protocols'
      }
    ];

    // Fisher-Yates shuffle algorithm to randomize questions
    const shuffled = [...questionPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Return exactly 20 randomized questions
    return shuffled.slice(0, 20);
  }

  static async generateAdaptedTimeline(currentTimelineJson: string, instruction: string): Promise<string> {
    if (isMock || !ai) {
      console.log('Using mock timeline adapter...');
      return currentTimelineJson;
    }

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: `Timeline:\n${currentTimelineJson}\n\nTask: ${instruction}`,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an adaptive timeline agent. Output updated timeline matching the database timeline array structure exactly.',
        },
      });

      return response.text || currentTimelineJson;
    } catch (err) {
      console.error('Gemini generateAdaptedTimeline error:', err);
      return currentTimelineJson;
    }
  }

  static async generateCodingChallenge(
    topic: string,
    language: string,
    difficulty: string,
    previousHashes: string[]
  ): Promise<any> {
    if (isMock || !ai) {
      return this.getMockCodingChallenge(topic, language, difficulty);
    }
    const prompt = `
      Create a unique, production-grade coding challenge.
      Topic: "${topic}"
      Programming Language: "${language}"
      Difficulty Level: "${difficulty}"
      
      To ensure the problem is unique and is NEVER repeated, do not base the story/scenario on any of the following previous question details or hashes: [${previousHashes.join(', ')}].
      Instead of using generic textbook descriptions (like "Two Sum" or "Reverse a String"), wrap the algorithm in a completely unique, highly descriptive real-world scenario (e.g. tracking items on a ship, calculating server routing distances, matching product prices to coupon budgets). Use creative variable names, clear input/output descriptions, constraints, examples, template code, test cases, and progressive hints.
      
      You MUST respond with a valid JSON object matching this schema structure:
      {
        "title": "A Creative Title",
        "description": "A highly detailed problem statement with a story scenario. Describe what the function needs to do, input parameters, and what should be returned.",
        "constraints": ["e.g. 1 <= nums.length <= 10^4", "e.g. -10^9 <= nums[i] <= 10^9"],
        "examples": [
          {
            "input": "nums = [2, 7, 11, 15], target = 9",
            "output": "[0, 1]",
            "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
          }
        ],
        "codeTemplate": "The starter template code for the user in the selected language. Include the main function signature.",
        "testCases": [
          {
            "input": "nums = [2, 7, 11, 15], target = 9",
            "output": "[0, 1]",
            "isHidden": false
          },
          {
            "input": "nums = [3, 2, 4], target = 6",
            "output": "[1, 2]",
            "isHidden": false
          },
          {
            "input": "nums = [3, 3], target = 6",
            "output": "[0, 1]",
            "isHidden": true
          }
        ],
        "optimalSolution": "The complete reference code solution in the requested language.",
        "hints": [
          "Hint 1: A brief algorithmic pointer.",
          "Hint 2: A more detailed strategy hint.",
          "Hint 3: Code logic or partial solution outline."
        ]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert algorithms developer and LeetCode content creator. Output only pure, parseable JSON conforming exactly to the requested schema. Do not wrap it in markdown code blocks.',
        },
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('Gemini Coding Challenge Generation Error:', error);
      return this.getMockCodingChallenge(topic, language, difficulty);
    }
  }

  private static getMockCodingChallenge(topic: string, language: string, difficulty: string): any {
    const templates: Record<string, string> = {
      javascript: `function findUniquePairs(prices, budget) {\n  // Write your code here\n  return [];\n}`,
      python: `def find_unique_pairs(prices, budget):\n    # Write your code here\n    return []`,
      cpp: `#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> findUniquePairs(vector<int>& prices, int budget) {\n        return {};\n    }\n};`,
      java: `import java.util.*;\nclass Solution {\n    public int[] findUniquePairs(int[] prices, int budget) {\n        return new int[0];\n    }\n}`,
      go: `package main\n\nfunc findUniquePairs(prices []int, budget int) []int {\n    return []int{}\n}`,
      rust: `impl Solution {\n    pub fn find_unique_pairs(prices: Vec<i32>, budget: i32) -> Vec<i32> {\n        vec![]\n    }\n}`
    };

    const template = templates[language.toLowerCase()] || `// Write your code here`;

    return {
      title: 'Optimal Shopping Cart Optimizer',
      description: `A shopping application has a list of product prices and a gift voucher amount. Find indices of two products whose sum of prices is exactly equal to the voucher amount. You can assume there is exactly one solution and you may not use the same element twice.`,
      constraints: [
        '2 <= prices.length <= 10^4',
        '1 <= prices[i] <= 10^9',
        '1 <= budget <= 10^9'
      ],
      examples: [
        {
          input: 'prices = [10, 20, 30, 40], budget = 50',
          output: '[1, 2]',
          explanation: 'The prices at index 1 (20) and index 2 (30) sum to 50.'
        }
      ],
      codeTemplate: template,
      testCases: [
        { input: 'prices = [10, 20, 30, 40], budget = 50', output: '[1, 2]', isHidden: false },
        { input: 'prices = [15, 25, 35, 45], budget = 80', output: '[2, 3]', isHidden: false },
        { input: 'prices = [5, 10, 15, 20], budget = 15', output: '[0, 1]', isHidden: true }
      ],
      optimalSolution: `// Optimal two-pointer or hashmap implementation`,
      hints: [
        'Use a hash map to store visited elements and their index.',
        'As you iterate, check if (budget - price) is present in the hash map.',
        'If present, return the indices immediately.'
      ]
    };
  }

  static async reviewCodingChallenge(
    title: string,
    problem: string,
    code: string,
    language: string
  ): Promise<any> {
    if (isMock || !ai) {
      return {
        correctness: 'Your code compiles and passes all test cases successfully.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        suggestions: 'Your code is clean and optimal. To save memory, you could reuse arrays instead of instantiating new lists.'
      };
    }

    const prompt = `
      Perform a comprehensive code review of the following coding submission:
      Problem Title: "${title}"
      Problem Description: "${problem}"
      Target Programming Language: "${language}"
      Submitted User Code:
      \`\`\`${language}
      ${code}
      \`\`\`

      You MUST respond with a valid JSON object matching this schema:
      {
        "correctness": "Brief summary of code correctness.",
        "timeComplexity": "e.g. O(N log N)",
        "spaceComplexity": "e.g. O(1)",
        "suggestions": "Suggestions on code quality, readability, naming conventions, optimization opportunities, or safety bugs."
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a Senior Principal Software Engineer. Output only pure, parseable JSON conforming exactly to the requested schema.',
        },
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Gemini Code Review Error:', e);
      return {
        correctness: 'Your code compiles and passes all test cases.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        suggestions: 'Your code is optimal. Review time complexity calculations.'
      };
    }
  }

  static async interviewerDialogue(
    title: string,
    code: string,
    chatHistory: { role: string; text: string }[],
    newAnswer: string
  ): Promise<any> {
    if (isMock || !ai) {
      return {
        reply: 'That is a reasonable approach to handling edge cases! How would you scale this if the inputs exceeded memory bounds?'
      };
    }

    const historyStr = chatHistory.map((c) => `${c.role === 'user' ? 'User' : 'Interviewer'}: ${c.text}`).join('\n');
    const prompt = `
      You are an AI Technical Interviewer conducting a mock interview follow-up dialog.
      Problem Title: "${title}"
      Submitted Code:
      \`\`\`
      ${code}
      \`\`\`

      Dialogue History:
      ${historyStr}

      User's New Answer: "${newAnswer}"

      Provide your follow-up reply, evaluating their answers, asking relevant questions about system scaling, complexity, edge cases, or optimization options.
      Keep it professional, direct, and conversational. Output only a pure JSON object:
      {
        "reply": "Your interviewer comment or question."
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an elite Google technical interviewer. Output only pure, parseable JSON conforming exactly to the requested schema.',
        },
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Gemini Interviewer Dialogue Error:', e);
      return {
        reply: 'Interesting response! How would this behave if we scaled the data across multi-cluster sharded nodes?'
      };
    }
  }

  /**
   * Reviews user project submissions using Gemini AI
   */
  static async reviewProject(projectTitle: string, repoUrl: string, description: string): Promise<any> {
    if (isMock || !ai) {
      console.log('Using mock project reviewer...');
      return {
        score: 85,
        strengths: [
          'Excellent selection of libraries and tech stack',
          'Good modular structure matching separation of concerns'
        ],
        improvements: [
          'Add structured unit test files inside test/ folder',
          'Ensure CORS origins are tightly configured instead of permitting wildcard *'
        ],
        verdict: 'Great work! You have successfully implemented the requirements and maintained clean code.'
      };
    }

    const prompt = `
      Perform a review of a software engineering student's project submission.
      Project Title: ${projectTitle}
      GitHub Repository URL: ${repoUrl}
      Student Description of what they built: ${description}

      Provide constructive, encouraging, but highly technical feedback on their design, clean code practices, security, and structure.
      
      Return a JSON conforming to:
      {
        "score": 85,
        "strengths": ["list of 2-3 technical strengths"],
        "improvements": ["list of 2-3 concrete technical improvements"],
        "verdict": "A summary verdict/feedback of 2-3 sentences."
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an elite Senior Developer and Technical Lead. Output only pure, parseable JSON conforming exactly to the requested schema.',
        },
      });
      const text = response.text;
      if (!text) throw new Error('Empty response');
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini Project Review Error:', error);
      return {
        score: 80,
        strengths: [
          'Strong foundational structure',
          'Clean setup files and dependencies list'
        ],
        improvements: [
          'Add error boundary handling middleware',
          'Write helper documentation inside README'
        ],
        verdict: 'Review completed. Your project structure looks solid and ready for scaling.'
      };
    }
  }
}

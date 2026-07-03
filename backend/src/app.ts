import './config/env';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';


import { connectDB } from './config/db';
import redis from './config/redis';

// Route Imports
import authRoutes from './routes/auth.routes';
import roadmapRoutes from './routes/roadmap.routes';
import quizRoutes from './routes/quiz.routes';
import taskRoutes from './routes/task.routes';
import resumeRoutes from './routes/resume.routes';
import portfolioRoutes from './routes/portfolio.routes';
import interviewRoutes from './routes/interview.routes';
import chatRoutes from './routes/chat.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import newsletterRoutes from './routes/newsletter.routes';
import contactRoutes from './routes/contact.routes';
import codingRoutes from './routes/coding-assessment.routes';

// Load environment variables



const app = express();
const server = http.createServer(app);

// Helper for dynamic CORS checking
const allowedOrigins = [
  'https://roadmapai.online',
  'https://www.roadmapai.online',
  'https://career-roadmap-generator-flax.vercel.app',
];

const checkOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  console.log('Incoming Origin:', origin);

  if (!origin) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  console.log('Blocked Origin:', origin);

  return callback(new Error('Not allowed by CORS'));
};

// Socket.io initialization
const io = new SocketIOServer(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Attach Socket.io to request object for use in controllers
app.use((req: any, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// Middleware configuration
app.use(helmet());
app.use(
  cors({
    origin: checkOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    exposedHeaders: ['x-new-access-token'],
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});
app.use('/api/', limiter);

// Basic status ping route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coding', codingRoutes);

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status,
    },
  });
});

// Bootstrap Server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();

  try {
    await redis.connect();
    console.log('Redis Connected');
  } catch (err) {
    console.warn('Failed to connect to Redis. Continuing without caching.', err);
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  });
};

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
});

export { app, server, io };

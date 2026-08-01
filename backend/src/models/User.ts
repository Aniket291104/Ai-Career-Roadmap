import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'student' | 'mentor' | 'admin';
  profilePicture?: string;
  googleId?: string;
  subscriptionTier?: 'free' | 'pro' | 'premium';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Verification & Auth states
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  otp?: string;
  otpExpiry?: Date;
  otpAttempts?: number;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  
  // Professional Details
  college?: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
  experience?: number; // years
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  
  // Learning style preferences
  careerGoal?: string;
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'mixed';
  dailyStudyHours: number;
  preferredLanguage: string;
  
  // Gamification Streak Tracking
  currentStreak: number;
  maxStreak: number;
  lastActiveDate?: Date;
  xpPoints: number;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    phone: { type: String },
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
    profilePicture: { type: String },
    googleId: { type: String },
    subscriptionTier: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    
    // Auth Verification
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    otp: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },

    // Professional & Profile metadata
    college: { type: String },
    university: { type: String },
    degree: { type: String },
    graduationYear: { type: Number },
    experience: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    github: { type: String },
    linkedin: { type: String },
    portfolioUrl: { type: String },
    resumeUrl: { type: String },
    leetcodeUsername: { type: String },
    codeforcesUsername: { type: String },

    // Preferences
    careerGoal: { type: String },
    learningStyle: { 
      type: String, 
      enum: ['visual', 'practical', 'theoretical', 'mixed'], 
      default: 'mixed' 
    },
    dailyStudyHours: { type: Number, default: 2 },
    preferredLanguage: { type: String, default: 'English' },

    // Streak tracker
    currentStreak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    xpPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import axios from 'axios';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, sendTokenCookies, clearTokenCookies } from '../utils/jwt';
import { sendEmail } from '../config/mailer';
import { registerSchema, loginSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, resendOtpSchema } from '../validators/auth.validator';
import { IAuthRequest } from '../middlewares/auth.middleware';

/**
 * Generate 6-digit numeric OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export class AuthController {
  
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { name, email, password, role } = parsed.data;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ message: 'User with this email already exists' });
        return;
      }

      // Hash password
      const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 4;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate verification OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'student',
        otp,
        otpExpiry,
        isVerified: false,
      });

      // Send verification email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to AI Career Roadmap!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering. Please verify your account using the OTP code below:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; background-color: #f3f4f6; padding: 15px; border-radius: 6px; letter-spacing: 4px; margin: 20px 0; color: #111827;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes.</p>
        </div>
      `;
      
      try {
        await sendEmail({
          to: email,
          subject: 'Verify Your AI Career Roadmap Account',
          html: emailHtml,
        });
      } catch (emailErr: any) {
        await User.findByIdAndDelete(user._id);
        res.status(500).json({ message: `Failed to send verification email: ${emailErr.message || emailErr}` });
        return;
      }

      res.status(201).json({
        message: 'Registration successful. OTP sent to email.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { email: rawEmail, otp: rawOtp } = parsed.data;
      const email = rawEmail.trim().toLowerCase();
      const otp = rawOtp.trim();

      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({ message: 'Email is already verified' });
        return;
      }

      console.log('=== DEBUG VERIFY OTP ===');
      console.log('Input Email:', email);
      console.log('Input OTP:', otp);
      console.log('Database User Email:', user.email);
      console.log('Database User OTP:', user.otp);
      console.log('Database User OTP Expiry:', user.otpExpiry);
      console.log('Current Date:', new Date());
      console.log('Condition results:');
      console.log('!user.otp:', !user.otp);
      console.log('!user.otpExpiry:', !user.otpExpiry);
      console.log('user.otp !== otp:', user.otp !== otp);
      console.log('user.otpExpiry < new Date():', user.otpExpiry ? user.otpExpiry < new Date() : true);
      console.log('========================');

      if (!user.otp || !user.otpExpiry || user.otp !== otp || user.otpExpiry < new Date()) {
        res.status(400).json({ message: 'Invalid or expired OTP code' });
        return;
      }

      // Mark verified, clear OTP
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      // Sign JWTs
      const payload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      sendTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        message: 'Account verified successfully',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error('OTP Verification Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = resendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { email } = parsed.data;
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({ message: 'Email is already verified' });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Verify Your Account</h2>
          <p>Hi ${user.name},</p>
          <p>Your new verification code is:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; background-color: #f3f4f6; padding: 15px; border-radius: 6px; letter-spacing: 4px; margin: 20px 0; color: #111827;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes.</p>
        </div>
      `;

      try {
        await sendEmail({
          to: email,
          subject: 'Resend Verification Code: AI Career Roadmap',
          html: emailHtml,
        });
      } catch (emailErr: any) {
        res.status(500).json({ message: `Failed to send verification email: ${emailErr.message || emailErr}` });
        return;
      }

      res.status(200).json({
        message: 'OTP code re-sent to your email successfully.',
      });
    } catch (error) {
      console.error('Resend OTP Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { email, password } = parsed.data;

      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      if (!user.password) {
        res.status(400).json({ message: 'Account uses Google OAuth login' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // If not verified, trigger new OTP and redirect
      if (!user.isVerified) {
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const emailHtml = `<h3>Please verify your email</h3><p>Your verification code is: <b>${otp}</b></p>`;
        try {
          await sendEmail({ to: user.email, subject: 'Verify Your Account', html: emailHtml });
        } catch (emailErr: any) {
          res.status(500).json({ message: `Failed to send verification email: ${emailErr.message || emailErr}` });
          return;
        }

        res.status(200).json({
          status: 'verify_otp',
          message: 'Account is unverified. OTP code re-sent to your email.',
          email: user.email,
        });
        return;
      }

      // Sign tokens
      const payload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      sendTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          skills: user.skills,
          careerGoal: user.careerGoal,
          currentStreak: user.currentStreak,
          xpPoints: user.xpPoints,
        },
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    clearTokenCookies(res);
    res.status(200).json({ message: 'Logged out successfully' });
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const email = parsed.data.email.trim().toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        // Obfuscate response for safety
        res.status(200).json({ message: 'If email exists, a password reset link has been dispatched.' });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
      const resetLink = `${clientUrl}/reset-password?token=${token}`;

      const emailHtml = `
        <h3>Reset Your Password</h3>
        <p>Please reset your password by clicking on the link below:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `;

      try {
        await sendEmail({
          to: email,
          subject: 'Reset Password: AI Career Roadmap',
          html: emailHtml,
        });
      } catch (emailErr: any) {
        res.status(500).json({ message: `Failed to send password reset email: ${emailErr.message || emailErr}` });
        return;
      }

      res.status(200).json({
        message: 'If email exists, a password reset link has been dispatched.',
      });
    } catch (error) {
      console.error('Forgot Password Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const { token, password } = parsed.data;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() },
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
      }

      // Hash new password
      const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 4;
      const salt = await bcrypt.genSalt(saltRounds);
      user.password = await bcrypt.hash(password, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      res.status(200).json({ message: 'Password has been updated successfully. You can now login.' });
    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      if (!credential) {
        res.status(400).json({ message: 'Google credential token is missing.' });
        return;
      }

      let email = '';
      let name = '';
      let sub = '';

      // Validate Token with Google API
      try {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        email = googleRes.data.email;
        name = googleRes.data.name;
        sub = googleRes.data.sub;
      } catch (err) {
        res.status(400).json({ message: 'Invalid Google OAuth credential token.' });
        return;
      }

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          googleId: sub,
          isVerified: true, // OAuth emails are verified
          role: 'student',
        });
      }

      const payload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      sendTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        message: 'Google Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          skills: user.skills,
          careerGoal: user.careerGoal,
          currentStreak: user.currentStreak,
          xpPoints: user.xpPoints,
        },
      });
    } catch (error) {
      console.error('Google Auth Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getCurrentUser(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Get Current User Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async updateProfile(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.format() });
        return;
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: parsed.data },
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getGoogleClientId(req: Request, res: Response): Promise<void> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      res.status(200).json({ clientId });
    } catch (error) {
      console.error('Get Google Client ID Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

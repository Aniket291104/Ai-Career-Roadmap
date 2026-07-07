import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, sendTokenCookies, ITokenPayload } from '../utils/jwt';
import { User } from '../models/User';

export interface IAuthRequest extends Request {
  user?: ITokenPayload;
}

export const authenticateJWT = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  let accessToken = req.cookies.accessToken;

  // Fallback to Header if cookie not set
  if (!accessToken && authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
  }

  if (!accessToken) {
    // If access token is missing, attempt rotation via refresh token
    const refreshToken = req.cookies.refreshToken || (req.headers['x-refresh-token'] as string);
    if (!refreshToken) {
      res.status(401).json({ message: 'Unauthorized. Authentication tokens missing.' });
      return;
    }

    try {
      const decodedRefresh = verifyRefreshToken(refreshToken);
      const newAccessToken = generateAccessToken({
        userId: decodedRefresh.userId,
        role: decodedRefresh.role,
      });

      sendTokenCookies(res, newAccessToken, refreshToken);
      res.setHeader('x-new-access-token', newAccessToken);
      req.user = { userId: decodedRefresh.userId, role: decodedRefresh.role };
      return next();
    } catch (refreshErr) {
      res.status(401).json({ message: 'Session expired. Please log in again.' });
      return;
    }
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    req.user = decoded;
    next();
  } catch (err: any) {
    // Token might be expired, check refresh token
    if (err.name === 'TokenExpiredError') {
      const refreshToken = req.cookies.refreshToken || (req.headers['x-refresh-token'] as string);
      if (!refreshToken) {
        res.status(401).json({ message: 'Unauthorized. Session expired.' });
        return;
      }

      try {
        const decodedRefresh = verifyRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken({
          userId: decodedRefresh.userId,
          role: decodedRefresh.role,
        });

        sendTokenCookies(res, newAccessToken, refreshToken);
        res.setHeader('x-new-access-token', newAccessToken);
        req.user = { userId: decodedRefresh.userId, role: decodedRefresh.role };
        return next();
      } catch (refreshErr) {
        res.status(401).json({ message: 'Session expired. Please log in again.' });
        return;
      }
    }

    res.status(401).json({ message: 'Unauthorized. Invalid token.' });
    return;
  }
};

export const checkRole = (allowedRoles: ('student' | 'mentor' | 'admin')[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Missing credentials.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden. You do not have permissions for this action.' });
      return;
    }

    next();
  };
};

export const requirePremiumSubscription = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Missing credentials.' });
    return;
  }

  const user = await User.findById(req.user.userId);
  const isFreeTier = !user || !user.subscriptionTier || user.subscriptionTier === 'free';
  if (isFreeTier) {
    res.status(403).json({
      message: 'This feature is only available on Premium Pro plans. Please upgrade your subscription to gain access.',
    });
    return;
  }

  next();
};


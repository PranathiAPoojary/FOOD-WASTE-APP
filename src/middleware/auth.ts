import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  isDemo?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Handle local development / demo tokens for easy testing
  if (token.startsWith('demo:')) {
    const role = token.replace('demo:', '') || 'donor';
    req.user = {
      uid: `demo_${role}_uid`,
      email: `${role}@foodcycle.org`,
      name: `Demo ${role.toUpperCase()}`,
      role: role,
      isDemo: true,
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
    };
    return next();
  } catch (error) {
    console.warn('Firebase token verification error (continuing unauthenticated):', error);
    return next();
  }
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Allow demo credentials for seamless demo and local testing
  if (token.startsWith('demo:')) {
    const role = token.replace('demo:', '') || 'donor';
    req.user = {
      uid: `demo_${role}_uid`,
      email: `${role}@foodcycle.org`,
      name: `Demo ${role.toUpperCase()}`,
      role: role,
      isDemo: true,
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
    };
    next();
  } catch (error) {
    console.error('Unauthorized: Invalid Firebase token', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

import { verifyToken } from '../utils/authUtils.js';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader) {
    token = authHeader;
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.userId) {
      req.userId = decoded.userId;
      req.user = decoded;
      return next();
    }
  }

  // Fallback for default local dev mode if no header supplied
  if (process.env.NODE_ENV !== 'production') {
    req.userId = DEFAULT_USER_ID;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Authentication token missing or invalid' });
}

import { verifyToken } from '../utils/authUtils.js';

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

  return res.status(401).json({ error: 'Unauthorized: Authentication token missing or invalid. Please sign in.' });
}

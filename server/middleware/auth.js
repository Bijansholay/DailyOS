let clerkExpress = null;
try {
  clerkExpress = await import('@clerk/express');
} catch (e) {
  // Clerk Express optional module
}

export function authMiddleware(req, res, next) {
  // 1. Read userId from Clerk auth object populated by clerkMiddleware
  if (req.auth && req.auth.userId) {
    req.userId = req.auth.userId;
    return next();
  }

  // 2. Read Authorization header
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (token) {
      req.userId = token;
      return next();
    }
  }

  return res.status(401).json({ 
    error: 'Unauthorized: Authentication token missing or invalid. Please sign in with Clerk.' 
  });
}

export function requireClerkAuth() {
  if (clerkExpress && clerkExpress.requireAuth) {
    return clerkExpress.requireAuth();
  }
  return authMiddleware;
}

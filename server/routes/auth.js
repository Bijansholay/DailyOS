import { dbEngine } from '../db.js';
import { 
  hashPassword, 
  verifyPassword, 
  createToken, 
  validateEmailFormat, 
  validatePasswordStrength,
  generateOtpCode
} from '../utils/authUtils.js';
import { authMiddleware } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  // Apply rate limiter to all auth routes
  router.use(authRateLimiter);

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!validateEmailFormat(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address (e.g. user@example.com).' });
      }

      const pwCheck = validatePasswordStrength(password);
      if (!pwCheck.valid) {
        return res.status(400).json({ error: pwCheck.message });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await dbEngine.findUserByEmail(cleanEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      const password_hash = hashPassword(password);
      const newUser = await dbEngine.createUser({ email: cleanEmail, password_hash });

      // Generate 6-digit OTP for 2FA verification step
      const otpCode = generateOtpCode();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      if (dbEngine.updateUserOtp) {
        await dbEngine.updateUserOtp(newUser.id, { otpCode, otpExpiresAt, attempts: 0 });
      }

      console.log(`🔐 [AUTH OTP GENERATED] For ${cleanEmail}: Verification Code [${otpCode}]`);

      res.status(201).json({
        requireOtp: true,
        email: cleanEmail,
        otpCode, // Returned for dev/demo mode verification
        message: `Account created! Please enter the 6-digit verification code sent to ${cleanEmail}.`
      });
    } catch (err) {
      console.error('Error during registration:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const user = await dbEngine.findUserByEmail(cleanEmail);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = verifyPassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate 6-digit OTP for login 2FA verification step
      const otpCode = generateOtpCode();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      if (dbEngine.updateUserOtp) {
        await dbEngine.updateUserOtp(user.id, { otpCode, otpExpiresAt, attempts: 0 });
      }

      console.log(`🔐 [AUTH OTP GENERATED] For ${cleanEmail}: Verification Code [${otpCode}]`);

      res.json({
        requireOtp: true,
        email: cleanEmail,
        otpCode, // Returned for dev/demo mode verification
        message: 'Security verification code generated. Please enter your 6-digit OTP code to complete sign in.'
      });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/request-otp
  router.post('/request-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!validateEmailFormat(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await dbEngine.findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email.' });
      }

      const otpCode = generateOtpCode();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      if (dbEngine.updateUserOtp) {
        await dbEngine.updateUserOtp(user.id, { otpCode, otpExpiresAt, attempts: 0 });
      }

      console.log(`🔐 [AUTH OTP RESENT] For ${cleanEmail}: Verification Code [${otpCode}]`);

      res.json({
        success: true,
        email: cleanEmail,
        otpCode,
        message: 'A new 6-digit verification code has been generated.'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/verify-otp
  router.post('/verify-otp', async (req, res) => {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const cleanOtp = String(otpCode).trim();

      const user = await dbEngine.findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      // If stored OTP verification is present
      if (user.otp_code) {
        if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
          return res.status(400).json({ error: 'OTP code has expired. Please click Resend Code to receive a new 6-digit code.' });
        }
        if (user.otp_attempts >= 3) {
          return res.status(400).json({ error: 'Maximum OTP verification attempts exceeded. Please click Resend Code.' });
        }
        if (user.otp_code !== cleanOtp) {
          if (dbEngine.updateUserOtp) {
            await dbEngine.updateUserOtp(user.id, { attempts: (user.otp_attempts || 0) + 1 });
          }
          return res.status(400).json({ error: 'Invalid 6-digit verification code. Please check and try again.' });
        }
      }

      // OTP Verification Succeeded - Issue Session JWT Token
      const token = createToken({ userId: user.id, email: user.email });

      // Clear OTP state
      if (dbEngine.updateUserOtp) {
        await dbEngine.updateUserOtp(user.id, { otpCode: null, otpExpiresAt: null, attempts: 0 });
      }

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      });
    } catch (err) {
      console.error('Error during OTP verification:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/demo
  router.post('/demo', async (req, res) => {
    try {
      const email = 'demo@dailyos.local';
      let demoUser = await dbEngine.findUserByEmail(email);

      if (!demoUser) {
        demoUser = await dbEngine.createUser({
          email,
          password_hash: hashPassword('demo-password-123')
        });
      }

      // Seed sample tasks if demo account has no tasks
      const existingTasks = await dbEngine.getTasks({ userId: demoUser.id });
      if (!existingTasks || existingTasks.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const sampleTasks = [
          { title: 'Design system review & component restyle', category: 'work', estimated_minutes: 45, scheduled_for: todayStr, priority: 'high' },
          { title: 'Review customer feedback & telemetry logs', category: 'work', estimated_minutes: 30, scheduled_for: todayStr, priority: 'medium' },
          { title: 'Database query optimization & indexing', category: 'work', estimated_minutes: 60, scheduled_for: todayStr, priority: 'high' },
          { title: 'Daily health & workout session', category: 'health', estimated_minutes: 45, scheduled_for: todayStr, priority: 'medium' },
          { title: 'Read 2 chapters of Executive Function Guide', category: 'school', estimated_minutes: 30, scheduled_for: null, priority: 'medium' }
        ];

        for (const t of sampleTasks) {
          await dbEngine.createTask({
            user_id: demoUser.id,
            title: t.title,
            category: t.category,
            estimated_minutes: t.estimated_minutes,
            scheduled_for: t.scheduled_for,
            priority: t.priority,
            status: 'pending'
          });
        }
      }

      const token = createToken({ userId: demoUser.id, email: demoUser.email });

      res.json({
        token,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          created_at: demoUser.created_at
        }
      });
    } catch (err) {
      console.error('Error during demo auth:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/me
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await dbEngine.findUserById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {
  console.warn('Express module not available for auth router');
}

export default router;

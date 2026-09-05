import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { loginIdRegex, passwordRegex } from '../validators/auth.js';

const tokenFor = user =>
  jwt.sign(
    {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: '1d' }
  );

const publicUser = user => ({
  id: user.id,
  loginId: user.loginId,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const setTokenCookie = (response, token) => {
  response.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
};

export async function register(request, response) {
  const { loginId, email, password, confirmPassword, name } = request.body || {};

  // Step 1: Login ID exists
  if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
    return response.status(400).json({ success: false, message: 'Please enter your Login ID.' });
  }

  const trimmedLoginId = loginId.trim();

  // Step 2 & 3: Login ID length & allowed characters
  if (trimmedLoginId.length < 6 || trimmedLoginId.length > 12) {
    return response.status(400).json({
      success: false,
      message: 'Login ID must be between 6 and 12 characters.'
    });
  }

  if (/\s/.test(trimmedLoginId)) {
    return response.status(400).json({
      success: false,
      message: 'Login ID cannot contain spaces.'
    });
  }

  if (!loginIdRegex.test(trimmedLoginId)) {
    return response.status(400).json({
      success: false,
      message: 'Login ID can only contain letters, numbers, and underscores.'
    });
  }

  // Step 4 & 5: Email exists & valid format
  if (!email || typeof email !== 'string' || !email.trim()) {
    return response.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return response.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  // Step 6 & 7: Password exists & strength
  if (!password || typeof password !== 'string') {
    return response.status(400).json({ success: false, message: 'Please enter your password.' });
  }

  if (!passwordRegex.test(password)) {
    return response.status(400).json({
      success: false,
      message:
        'Password must be more than 8 characters, and contain at least one lowercase letter, one uppercase letter, and one special character.'
    });
  }

  // Step 8 & 9: Confirm password exists & matches
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    return response.status(400).json({ success: false, message: 'Please confirm your password.' });
  }

  if (password !== confirmPassword) {
    return response.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    // Step 10: Check Login ID uniqueness
    const existingLoginId = await prisma.user.findUnique({
      where: { loginId: trimmedLoginId }
    });
    if (existingLoginId) {
      return response.status(400).json({ success: false, message: 'Login ID already exists.' });
    }

    // Step 11: Check Email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });
    if (existingEmail) {
      return response.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in PostgreSQL (always role CONTACT for public signups)
    const user = await prisma.user.create({
      data: {
        loginId: trimmedLoginId,
        name: name?.trim() || trimmedLoginId,
        email: trimmedEmail,
        passwordHash,
        role: 'CONTACT'
      }
    });

    const token = tokenFor(user);
    setTokenCookie(response, token);

    return response.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: publicUser(user),
        token
      }
    });
  } catch (error) {
    // Handle Prisma unique constraint race conditions gracefully (P2002)
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes('loginId')) {
        return response.status(400).json({ success: false, message: 'Login ID already exists.' });
      }
      if (Array.isArray(target) && target.includes('email')) {
        return response.status(400).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }
    }

    console.error('Signup error:', error);
    return response.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
}

export async function login(request, response) {
  const { loginId, password } = request.body || {};

  // Step 1: Check that Login ID is not empty
  if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
    return response.status(400).json({ success: false, message: 'Please enter your Login ID.' });
  }

  // Step 2: Check that Password is not empty
  if (!password || typeof password !== 'string' || !password) {
    return response.status(400).json({ success: false, message: 'Please enter your password.' });
  }

  try {
    // Step 3: Search PostgreSQL User table using loginId
    const user = await prisma.user.findUnique({
      where: { loginId: loginId.trim() }
    });

    // Step 4: Compare entered password with stored passwordHash
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      // Do not reveal whether Login ID exists
      return response.status(401).json({
        success: false,
        message: 'Invalid Login Id or Password'
      });
    }

    const token = tokenFor(user);
    setTokenCookie(response, token);

    return response.json({
      success: true,
      message: 'Sign in successful.',
      data: {
        user: publicUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return response.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
}

export async function logout(_request, response) {
  response.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return response.json({ success: true, message: 'Logged out successfully.' });
}

export async function session(request, response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id }
    });

    if (!user) {
      return response.status(401).json({ success: false, message: 'Session expired' });
    }

    return response.json({
      success: true,
      data: {
        user: publicUser(user)
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return response.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
}

export async function checkLoginId(request, response) {
  const { loginId } = request.query;
  if (!loginId || typeof loginId !== 'string') {
    return response.status(400).json({ success: false, message: 'loginId query parameter is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { loginId: loginId.trim() },
      select: { id: true }
    });
    return response.json({ success: true, available: !user });
  } catch (error) {
    console.error('checkLoginId error:', error);
    return response.status(500).json({ success: false, message: 'Unable to check Login ID availability' });
  }
}

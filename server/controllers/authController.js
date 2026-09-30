const User = require('../models/User');
const { signAuthToken, getCookieOptions } = require('../utils/jwt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role selected',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email is already registered',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    });

    const token = signAuthToken(user);
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const token = signAuthToken(user);
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie('token', {
    ...getCookieOptions(),
    maxAge: undefined,
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
}

module.exports = {
  register,
  login,
  me,
  logout,
};

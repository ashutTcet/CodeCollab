const jwt = require('jsonwebtoken');

function signAuthToken(user) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
}

module.exports = {
  signAuthToken,
  getCookieOptions,
};

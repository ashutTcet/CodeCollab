const jwt = require('jsonwebtoken');

function extractToken(req) {
  const cookieToken = req.cookies && req.cookies.token;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7);
}

function authMiddleware(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({
      message: 'Authentication is not configured',
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    });
  }
}

module.exports = authMiddleware;

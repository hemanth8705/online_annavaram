import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token and authenticate admin
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Access denied.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach admin info to request
      req.admin = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Access denied.' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

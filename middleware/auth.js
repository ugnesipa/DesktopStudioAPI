// Middleware to ensure user is logged in
const loginRequired = (req, res, next) => {
    if (req.user) return next();
    return res.status(401).json({ message: 'Unauthorized user' });
  };
  
  // Middleware to allow only admins
  const adminRequired = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden: You do not have the required permissions' });
    }
    next();
  };
  
  // Middleware to allow only masters
  const masterRequired = (req, res, next) => {
    if (!req.user || req.user.role !== 'master') {
      return res.status(403).json({ message: 'Access forbidden: You do not have the required permissions' });
    }
    next();
  };

  module.exports = {
    loginRequired,
    adminRequired,
    masterRequired
  };
  
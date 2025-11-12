export const authorize = (...roles) => {
  return (req, res, next) => {
    // 'roles' is an array like ['Admin', 'Manager']
    // req.user.RoleName was attached by the 'protect' middleware
    if (!roles.includes(req.user.RoleName)) {
      return res.status(403).json({ 
        message: `User role '${req.user.RoleName}' is not authorized to access this route` 
      });
    }
    next();
  };
};
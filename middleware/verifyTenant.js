module.exports = (req, res, next) => {
  // Check if user and companyId exist
  if (!req.user || !req.user.companyId) {
    console.error(`[TENANT SECURITY ERROR] Missing companyId in request for User ID: ${req.user ? req.user.id : 'Unknown'}`);
    return res.status(403).json({ 
      msg: 'Access Denied: Tenant Isolation Check Failed. Please log in again.' 
    });
  }

  // If passed, proceed to controller
  next();
};

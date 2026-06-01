module.exports = (permissionKey) => {
    return (req, res, next) => {
        const { role, permissions } = req.user;

        // Admins have all permissions (case-insensitive)
        if (role && role.toLowerCase() === 'admin') return next();

        // Check if user has the specific permission
        if (permissions && permissions[permissionKey] === true) {
            return next();
        }

        return res.status(403).json({ msg: 'Access denied: You do not have permission for this action.' });
    };
};

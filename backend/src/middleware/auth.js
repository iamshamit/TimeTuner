const JWTService = require('../services/jwtService');
const User = require('../models/User');
const { AppError } = require('../utils/appError');
const { hasPermission } = require('../config/permissions');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
    try {
        // 1. Get token from header
        let token;
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in. Please log in to get access.', 401));
        }

        // 2. Verify token
        let decoded;
        try {
            decoded = JWTService.verifyAccessToken(token);
        } catch (error) {
            return next(new AppError('Invalid or expired token', 401));
        }

        // 3. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 4. Check if user is active
        if (!currentUser.isActive) {
            return next(new AppError('Your account has been deactivated.', 403));
        }

        // 5. Check if user changed password after token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('Password recently changed. Please log in again.', 401));
        }

        // Grant access - attach user to request
        req.user = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

// Check specific permission
exports.checkPermission = (permission) => {
    return (req, res, next) => {
        if (!hasPermission(req.user.role, permission)) {
            return next(new AppError(`Permission denied: ${permission}`, 403));
        }
        next();
    };
};

// Check department access (for HODs)
exports.checkDepartmentAccess = async (req, res, next) => {
    // Admin can access all departments
    if (req.user.role === 'admin') {
        return next();
    }

    // Get department from request (params, query, or body)
    const departmentId = req.params.departmentId || req.query.department || req.body.department;

    // If no department specified, continue (will be filtered later)
    if (!departmentId) {
        return next();
    }

    // Check if user's department matches
    if (req.user.department?.toString() !== departmentId.toString()) {
        return next(new AppError('You can only access your own department resources', 403));
    }

    next();
};

// Optional authentication - doesn't require login but attaches user if logged in
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = JWTService.verifyAccessToken(token);
                const currentUser = await User.findById(decoded.id);
                if (currentUser && currentUser.isActive) {
                    req.user = currentUser;
                }
            } catch (error) {
                // Token invalid, but don't fail - just continue without user
            }
        }

        next();
    } catch (error) {
        next();
    }
};

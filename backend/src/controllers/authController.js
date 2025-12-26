const crypto = require('crypto');
const User = require('../models/User');
const JWTService = require('../services/jwtService');
const { AppError, catchAsync } = require('../utils/appError');

// Register new user
exports.register = catchAsync(async (req, res, next) => {
    const { email, password, name, role, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email already registered', 400));
    }

    // Create user (password hashing happens in pre-save hook)
    const user = await User.create({
        email,
        password,
        name,
        role: role || 'viewer',
        department
    });

    // Generate tokens
    const tokens = JWTService.generateTokens(user);

    // Save refresh token to database
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            tokens
        }
    });
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
        return next(new AppError('Invalid email or password', 401));
    }

    // Check if account is locked
    if (user.isLocked) {
        return next(new AppError('Account is temporarily locked. Try again later.', 423));
    }

    // Check if account is active
    if (!user.isActive) {
        return next(new AppError('Account is deactivated. Contact administrator.', 403));
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        // Increment failed attempts
        await user.incLoginAttempts();
        return next(new AppError('Invalid email or password', 401));
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
        await user.updateOne({
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 }
        });
    }

    // Generate tokens
    const tokens = JWTService.generateTokens(user);

    // Save refresh token and update last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department
            },
            accessToken: tokens.accessToken
        }
    });
});

// Refresh access token
exports.refreshToken = catchAsync(async (req, res, next) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return next(new AppError('Refresh token not provided', 401));
    }

    // Verify refresh token
    let decoded;
    try {
        decoded = JWTService.verifyRefreshToken(refreshToken);
    } catch (error) {
        return next(new AppError('Invalid or expired refresh token', 401));
    }

    // Find user with matching refresh token
    const user = await User.findOne({
        _id: decoded.id,
        refreshToken: refreshToken
    });

    if (!user) {
        return next(new AppError('User not found or token revoked', 401));
    }

    if (!user.isActive) {
        return next(new AppError('Account is deactivated', 403));
    }

    // Generate new access token
    const newAccessToken = JWTService.generateAccessToken(user);

    res.status(200).json({
        success: true,
        data: {
            accessToken: newAccessToken
        }
    });
});

// Logout user
exports.logout = catchAsync(async (req, res, next) => {
    // Clear refresh token from database
    await User.findByIdAndUpdate(req.user._id, {
        refreshToken: undefined
    });

    // Clear cookie
    res.cookie('refreshToken', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate('department', 'code name');

    res.status(200).json({
        success: true,
        data: { user }
    });
});

// Change password
exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    // Generate new tokens
    const tokens = JWTService.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        data: { accessToken: tokens.accessToken }
    });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal if email exists
        return res.status(200).json({
            success: true,
            message: 'If email exists, password reset instructions will be sent.'
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to user
    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // In a real app, send email here
    // For development, just return the token
    res.status(200).json({
        success: true,
        message: 'Password reset link sent to email',
        // DEV ONLY: Remove this in production
        ...(process.env.NODE_ENV === 'development' && { resetURL })
    });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Invalidate all sessions

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful. Please log in with your new password.'
    });
});

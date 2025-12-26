# 📋 PHASE 3: Authentication & Authorization System

> **Duration:** 2-3 days  
> **Dependencies:** Phase 2  
> **Priority:** Critical - Security Foundation

---

## 🎯 Phase Objectives

Implement a complete authentication system with JWT tokens, role-based access control (RBAC), and secure password handling.

---

## 📑 Task Breakdown

---

### 3.1 User Schema & Model Design

**Goal:** Create a secure User model with all necessary fields.

**Step-by-Step Instructions:**

1. **Create the User Model** (`models/User.js`):

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // IMPORTANT: Never return password in queries
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'hod', 'scheduler', 'viewer'],
      message: '{VALUE} is not a valid role'
    },
    default: 'viewer'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  refreshToken: {
    type: String,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// VIRTUAL: Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// PRE-SAVE: Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  // Hash password with cost factor of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Update passwordChangedAt
  this.passwordChangedAt = Date.now() - 1000; // -1s to ensure token is created after
  
  next();
});

// METHOD: Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// METHOD: Check if password changed after token was issued
userSchema.methods.changedPasswordAfter = function(jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// METHOD: Increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
```

---

### 3.2 Password Hashing Strategy (bcrypt)

**Goal:** Implement secure password hashing.

**Key Points:**

1. **Cost Factor:** Use 12 rounds (balance between security and performance)
2. **Never store plain passwords**
3. **Use bcrypt.compare() for verification**

**Password Requirements (enforce in validation):**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

```javascript
// utils/validators.js
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validatePassword = (password) => {
  if (!passwordRegex.test(password)) {
    throw new Error('Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character');
  }
  return true;
};
```

---

### 3.3 JWT Token Architecture (Access + Refresh)

**Goal:** Implement dual-token authentication.

**Step-by-Step Instructions:**

1. **Install Dependencies:**
   ```bash
   npm install jsonwebtoken
   ```

2. **Create JWT Service** (`services/jwtService.js`):

```javascript
const jwt = require('jsonwebtoken');

class JWTService {
  // Generate Access Token (short-lived: 15 minutes)
  static generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }
  
  // Generate Refresh Token (long-lived: 7 days)
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  // Verify Access Token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }
  
  // Verify Refresh Token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
  
  // Generate both tokens
  static generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  }
}

module.exports = JWTService;
```

3. **Add to `.env`:**
   ```env
   JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
   ```

---

### 3.4 Role Definition

**Goal:** Define clear roles with descriptions.

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System administrator | Full access to everything |
| `hod` | Head of Department | Manage dept resources, approve timetables |
| `scheduler` | Scheduler staff | Create/edit timetables, manage entities |
| `viewer` | Faculty/Students | View timetables only |

---

### 3.5 Permission Matrix Creation

**Goal:** Create a detailed permission matrix.

```javascript
// config/permissions.js
const PERMISSIONS = {
  // User Management
  'users:read': ['admin'],
  'users:create': ['admin'],
  'users:update': ['admin'],
  'users:delete': ['admin'],
  
  // Department Management
  'departments:read': ['admin', 'hod', 'scheduler', 'viewer'],
  'departments:create': ['admin'],
  'departments:update': ['admin'],
  'departments:delete': ['admin'],
  
  // Faculty Management
  'faculties:read': ['admin', 'hod', 'scheduler', 'viewer'],
  'faculties:create': ['admin', 'hod'],
  'faculties:update': ['admin', 'hod'],
  'faculties:delete': ['admin'],
  
  // Room Management
  'rooms:read': ['admin', 'hod', 'scheduler', 'viewer'],
  'rooms:create': ['admin', 'scheduler'],
  'rooms:update': ['admin', 'scheduler'],
  'rooms:delete': ['admin'],
  
  // Subject Management
  'subjects:read': ['admin', 'hod', 'scheduler', 'viewer'],
  'subjects:create': ['admin', 'hod'],
  'subjects:update': ['admin', 'hod'],
  'subjects:delete': ['admin'],
  
  // Batch Management
  'batches:read': ['admin', 'hod', 'scheduler', 'viewer'],
  'batches:create': ['admin', 'hod', 'scheduler'],
  'batches:update': ['admin', 'hod', 'scheduler'],
  'batches:delete': ['admin', 'hod'],
  
  // Timetable Management
  'timetables:read': ['admin', 'hod', 'scheduler', 'viewer'],
  'timetables:create': ['admin', 'hod', 'scheduler'],
  'timetables:update': ['admin', 'hod', 'scheduler'],
  'timetables:delete': ['admin', 'hod'],
  'timetables:approve': ['admin', 'hod'],
  'timetables:publish': ['admin', 'hod'],
  
  // Solver
  'solver:run': ['admin', 'hod', 'scheduler'],
  'solver:cancel': ['admin', 'hod', 'scheduler']
};

const hasPermission = (role, permission) => {
  return PERMISSIONS[permission]?.includes(role) || false;
};

const getPermissionsForRole = (role) => {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
};

module.exports = { PERMISSIONS, hasPermission, getPermissionsForRole };
```

---

### 3.6 Registration API Implementation

**Goal:** Create user registration endpoint.

```javascript
// controllers/authController.js
const User = require('../models/User');
const JWTService = require('../services/jwtService');
const { AppError } = require('../utils/appError');

exports.register = async (req, res, next) => {
  try {
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
    
    // Remove password from output
    user.password = undefined;
    
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
  } catch (error) {
    next(error);
  }
};
```

---

### 3.7 Login API Implementation

**Goal:** Create secure login endpoint.

```javascript
// controllers/authController.js (continued)
exports.login = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
```

---

### 3.8 Token Refresh Mechanism

**Goal:** Implement token refresh endpoint.

```javascript
// controllers/authController.js (continued)
exports.refreshToken = async (req, res, next) => {
  try {
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
    
    // Generate new access token
    const newAccessToken = JWTService.generateAccessToken(user);
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 3.9 Auth Middleware Development

**Goal:** Create middleware to protect routes.

```javascript
// middleware/auth.js
const JWTService = require('../services/jwtService');
const User = require('../models/User');
const { AppError } = require('../utils/appError');

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
```

---

### 3.10 Role-Based Access Control (RBAC) Middleware

**Goal:** Create middleware to check permissions.

```javascript
// middleware/auth.js (continued)
const { hasPermission } = require('../config/permissions');

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
```

---

### 3.11 Password Reset Flow

**Goal:** Implement forgot/reset password functionality.

```javascript
// controllers/authController.js (continued)
const crypto = require('crypto');
const sendEmail = require('../utils/email');

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists - security best practice
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
    
    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request (valid for 10 minutes)',
        message: `Click here to reset your password: ${resetURL}`
      });
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to email'
      });
    } catch (error) {
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return next(new AppError('Error sending email. Try again later.', 500));
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
```

---

### 3.12 Session Management

**Goal:** Implement logout and session management.

```javascript
// controllers/authController.js (continued)
exports.logout = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    // Clear all refresh tokens (force logout on all devices)
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: undefined
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department
      }
    }
  });
};
```

---

### API Routes Setup

```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.patch('/update-password', authController.updatePassword);

module.exports = router;
```

---

## ✅ Phase 3 Completion Checklist

```
□ User model created with password hashing
□ bcrypt implemented with proper salt rounds
□ JWT service created with access & refresh tokens
□ Roles defined (admin, hod, scheduler, viewer)
□ Permission matrix created
□ Registration API working
□ Login API working with security features
□ Token refresh endpoint working
□ Auth middleware protecting routes
□ RBAC middleware checking permissions
□ Password reset flow complete
□ Logout functionality working
□ All auth routes tested
□ Security headers added (helmet)
□ Rate limiting implemented for auth routes
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Once all items are checked, proceed to **Phase 4: Core Backend - Entity Management APIs**

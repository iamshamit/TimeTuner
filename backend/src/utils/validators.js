const Joi = require('joi');

// Password requirements: min 8 chars, uppercase, lowercase, number, special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(passwordRegex).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
        'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
    }),
    role: Joi.string().valid('admin', 'hod', 'scheduler', 'viewer').default('viewer'),
    department: Joi.string().hex().length(24).when('role', {
        is: 'hod',
        then: Joi.required().messages({
            'any.required': 'Department is required for HOD role'
        })
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(8).pattern(passwordRegex).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
        'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Confirm password is required'
    })
});

const validatePassword = (password) => {
    if (!passwordRegex.test(password)) {
        throw new Error('Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character');
    }
    return true;
};

module.exports = {
    passwordRegex,
    registerSchema,
    loginSchema,
    resetPasswordSchema,
    validatePassword
};

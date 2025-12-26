const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return { statusCode: 400, message };
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return { statusCode: 400, message };
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return { statusCode: 400, message };
};

const handleJWTError = () => ({
    statusCode: 401,
    message: 'Invalid token. Please log in again.'
});

const handleJWTExpiredError = () => ({
    statusCode: 401,
    message: 'Your token has expired. Please log in again.'
});

module.exports = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let status = err.status || 'error';

    // Handle specific error types
    if (err.name === 'CastError') {
        const error = handleCastErrorDB(err);
        statusCode = error.statusCode;
        message = error.message;
    }

    if (err.code === 11000) {
        const error = handleDuplicateFieldsDB(err);
        statusCode = error.statusCode;
        message = error.message;
    }

    if (err.name === 'ValidationError') {
        const error = handleValidationErrorDB(err);
        statusCode = error.statusCode;
        message = error.message;
    }

    if (err.name === 'JsonWebTokenError') {
        const error = handleJWTError();
        statusCode = error.statusCode;
        message = error.message;
    }

    if (err.name === 'TokenExpiredError') {
        const error = handleJWTExpiredError();
        statusCode = error.statusCode;
        message = error.message;
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    res.status(statusCode).json({
        success: false,
        status,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    });
};

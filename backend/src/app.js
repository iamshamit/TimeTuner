const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'timetuner-backend' });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/departments', require('./routes/departments'));
app.use('/api/v1/faculties', require('./routes/faculties'));
app.use('/api/v1/rooms', require('./routes/rooms'));
app.use('/api/v1/subjects', require('./routes/subjects'));
app.use('/api/v1/batches', require('./routes/batches'));
app.use('/api/v1/timeslots', require('./routes/timeslots'));
app.use('/api/v1/constraints', require('./routes/constraints'));
app.use('/api/v1/solver', require('./routes/solver'));
app.use('/api/v1/timetables', require('./routes/timetables'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        // Start solver worker if Redis is available
        if (process.env.REDIS_URL || process.env.ENABLE_WORKER === 'true') {
            try {
                require('./workers/solverWorker');
                console.log('✅ Solver worker started');
            } catch (err) {
                console.warn('⚠️ Solver worker not started:', err.message);
            }
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 API: http://localhost:${PORT}/api/v1`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

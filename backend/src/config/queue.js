const { Queue, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

// Handle connection errors gracefully
redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

redisConnection.on('connect', () => {
    console.log('Connected to Redis');
});

// Solver job queue
const solverQueue = new Queue('solver-jobs', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50
    }
});

// Queue events for monitoring
const solverQueueEvents = new QueueEvents('solver-jobs', {
    connection: redisConnection
});

// Event handlers
solverQueueEvents.on('completed', ({ jobId }) => {
    console.log(`Solver job ${jobId} completed`);
});

solverQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`Solver job ${jobId} failed: ${failedReason}`);
});

module.exports = { solverQueue, solverQueueEvents, redisConnection };

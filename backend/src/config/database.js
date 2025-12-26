const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        // Only explicitly set TLS options if needed, otherwise let the URI decide
        if (process.env.MONGO_TLS === 'true') {
            options.tls = true;
            options.tlsAllowInvalidCertificates = process.env.MONGO_TLS_ALLOW_INVALID === 'true';
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

module.exports = connectDB;

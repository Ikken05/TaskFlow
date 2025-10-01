import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Import routes
import authRoutes from './routes/authRoutes';

const app = express();

// CORS configuration
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// Middleware
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    console.log(`[${timestamp}] ${method} ${path} - IP: ${ip} - UserAgent: ${userAgent}`);

    // Log request body for POST/PUT requests (excluding sensitive data)
    if ((method === 'POST' || method === 'PUT') && req.body) {
        const logBody = { ...req.body };
        // Remove sensitive fields from logging
        if (logBody.password) logBody.password = '[REDACTED]';
        if (logBody.newPassword) logBody.newPassword = '[REDACTED]';
        console.log(`[${timestamp}] Request body:`, JSON.stringify(logBody, null, 2));
    }

    next();
});

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'TaskFlow API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] 404 - Route not found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timestamp = new Date().toISOString();
    const errorId = crypto.randomUUID();

    console.error(`[${timestamp}] GLOBAL ERROR [ID: ${errorId}]:`);
    console.error(`Route: ${req.method} ${req.originalUrl}`);
    console.error(`IP: ${req.ip}`);
    console.error(`User-Agent: ${req.get('User-Agent')}`);
    console.error(`Error name: ${err.name}`);
    console.error(`Error message: ${err.message}`);
    console.error(`Stack trace:`, err.stack);

    if (req.body && Object.keys(req.body).length > 0) {
        const logBody = { ...req.body };
        if (logBody.password) logBody.password = '[REDACTED]';
        if (logBody.newPassword) logBody.newPassword = '[REDACTED]';
        console.error(`Request body:`, JSON.stringify(logBody, null, 2));
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        errorId: errorId
    });
});

const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`TaskFlow server running on http://localhost:${PORT}/`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
});

// MongoDB connection
const mongoUrl = process.env.MONGODB_URI || "mongodb+srv://Ikken:6oUalaUyn3voF3kV@task.ihjxyln.mongodb.net/taskflow";

mongoose.Promise = Promise;

mongoose.connect(mongoUrl)
    .then(() => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ✅ Connected to MongoDB successfully`);
        console.log(`[${timestamp}] Database: ${mongoose.connection.db.databaseName}`);
        console.log(`[${timestamp}] Connection state: ${mongoose.connection.readyState}`);
    })
    .catch((error) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ❌ MongoDB connection error:`);
        console.error(`[${timestamp}] Error name: ${error.name}`);
        console.error(`[${timestamp}] Error message: ${error.message}`);
        console.error(`[${timestamp}] Connection string: ${mongoUrl.replace(/\/\/.*:.*@/, '//***:***@')}`);
        console.error(`[${timestamp}] Stack trace:`, error.stack);
        process.exit(1);
    });

mongoose.connection.on('error', (error: Error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ MongoDB runtime error:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Connection state: ${mongoose.connection.readyState}`);
});

mongoose.connection.on('disconnected', () => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️  MongoDB disconnected - attempting to reconnect...`);
});

mongoose.connection.on('reconnected', () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ MongoDB reconnected successfully`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 Received SIGINT. Shutting down gracefully...`);

    try {
        await mongoose.connection.close();
        console.log(`[${timestamp}] ✅ MongoDB connection closed`);
    } catch (error) {
        console.error(`[${timestamp}] ❌ Error closing MongoDB connection:`, error);
    }

    server.close(() => {
        console.log(`[${timestamp}] ✅ Server closed`);
        process.exit(0);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 💥 UNHANDLED PROMISE REJECTION:`);
    console.error(`[${timestamp}] Promise:`, promise);
    console.error(`[${timestamp}] Reason:`, reason);
    console.error(`[${timestamp}] Stack trace:`, reason instanceof Error ? reason.stack : 'No stack trace available');

    // Close server gracefully
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 💥 UNCAUGHT EXCEPTION:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);

    // Close server gracefully
    server.close(() => {
        process.exit(1);
    });
});
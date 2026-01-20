const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swagger');

// Database
const { connectDB, syncDB } = require('./config/database');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const {
    authRoutes,
    workerRoutes,
    salaryRoutes,
    stockRoutes,
    clientRoutes,
    paymentRoutes,
    dashboardRoutes
} = require('./routes');

// Logger
const logger = require('./utils/logger');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: {
        success: false,
        message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://cleancontrol-eta.vercel.app/',
            process.env.CORS_ORIGIN
        ].filter(Boolean);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            // For dev, let's be lenient but log it
            // return callback(null, true); // Uncomment to allow all in dev
            // Strict check:
            const msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
            // console.log(msg); // Debug
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Salihate Clean API Documentation'
}));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api', stockRoutes); // Contains /categories, /products, /stock/*
app.use('/api/clients', clientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', dashboardRoutes); // For /notifications routes

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Sync database models (in development)
        if (process.env.NODE_ENV === 'development') {
            await syncDB(false); // false = don't drop tables
        }

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

module.exports = app;

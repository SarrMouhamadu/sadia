const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'salihate_clean_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    }
);

// Test database connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');
        return sequelize;
    } catch (error) {
        console.error('PostgreSQL connection error:', error.message);
        process.exit(1);
    }
};

// Sync database (for development)
const syncDB = async (force = false) => {
    try {
        await sequelize.sync({ force, alter: !force });
        console.log('Database synchronized');
    } catch (error) {
        console.error('Database sync error:', error.message);
        throw error;
    }
};

// Disconnect DB
const disconnectDB = async () => {
    try {
        await sequelize.close();
        console.log('PostgreSQL disconnected');
    } catch (error) {
        console.error('PostgreSQL disconnection error:', error.message);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    connectDB,
    syncDB,
    disconnectDB
};


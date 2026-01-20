const authRoutes = require('./auth.routes');
const workerRoutes = require('./worker.routes');
const salaryRoutes = require('./salary.routes');
const stockRoutes = require('./stock.routes');
const clientRoutes = require('./client.routes');
const paymentRoutes = require('./payment.routes');
const dashboardRoutes = require('./dashboard.routes');

module.exports = {
    authRoutes,
    workerRoutes,
    salaryRoutes,
    stockRoutes,
    clientRoutes,
    paymentRoutes,
    dashboardRoutes
};

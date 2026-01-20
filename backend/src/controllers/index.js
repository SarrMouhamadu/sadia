const authController = require('./auth.controller');
const workerController = require('./worker.controller');
const salaryController = require('./salary.controller');
const stockController = require('./stock.controller');
const clientController = require('./client.controller');
const dashboardController = require('./dashboard.controller');

module.exports = {
    authController,
    workerController,
    salaryController,
    stockController,
    clientController,
    dashboardController
};

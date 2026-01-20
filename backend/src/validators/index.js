const authValidator = require('./auth.validator');
const workerValidator = require('./worker.validator');
const salaryValidator = require('./salary.validator');
const stockValidator = require('./stock.validator');
const clientValidator = require('./client.validator');

module.exports = {
    ...authValidator,
    ...workerValidator,
    ...salaryValidator,
    ...stockValidator,
    ...clientValidator
};

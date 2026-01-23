const express = require('express');
const router = express.Router();
const { salaryController } = require('../controllers');
const { authMiddleware, staffOnly, adminOnly, validate } = require('../middlewares');
const {
    createSalaryValidator,
    updateSalaryValidator,
    paySalaryValidator,
    salaryIdValidator,
    listSalariesValidator,
    generateMonthValidator,
    workerSalariesValidator,
    generateBulletinValidator,
    getBulletinValidator
} = require('../validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     Salary:
 *       type: object
 *       required:
 *         - worker_id
 *         - mois
 *         - annee
 *         - salaire_base
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         worker_id:
 *           type: string
 *           format: uuid
 *         mois:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         annee:
 *           type: integer
 *         salaire_base:
 *           type: number
 *         primes:
 *           type: number
 *         primes_details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               amount:
 *                 type: number
 *         deductions:
 *           type: number
 *         deductions_details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               amount:
 *                 type: number
 *         salaire_net:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [EN_ATTENTE, PAYE, ANNULE]
 *         date_paiement:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/salaries:
 *   post:
 *     summary: Create a new salary record
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - worker_id
 *               - mois
 *               - annee
 *               - salaire_base
 *             properties:
 *               worker_id:
 *                 type: string
 *                 format: uuid
 *               mois:
 *                 type: integer
 *                 example: 1
 *               annee:
 *                 type: integer
 *                 example: 2024
 *               salaire_base:
 *                 type: number
 *                 example: 3500
 *               primes:
 *                 type: number
 *                 example: 500
 *               deductions:
 *                 type: number
 *                 example: 200
 *     responses:
 *       201:
 *         description: Salary created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Salary already exists for this month
 */
router.post('/', authMiddleware, staffOnly, createSalaryValidator, validate, salaryController.createSalary);

/**
 * @swagger
 * /api/salaries:
 *   get:
 *     summary: Get all salaries with filters
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, PAYE, ANNULE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of salaries
 */
router.get('/', authMiddleware, staffOnly, listSalariesValidator, validate, salaryController.getSalaries);

/**
 * @swagger
 * /api/salaries/stats:
 *   get:
 *     summary: Get salary statistics for a month
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salary statistics
 */
router.get('/stats', authMiddleware, staffOnly, salaryController.getSalaryStats);

/**
 * @swagger
 * /api/salaries/bulletin:
 *   post:
 *     summary: Generate PDF bulletin for a worker (auto-create salary if needed)
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - worker_id
 *             properties:
 *               worker_id:
 *                 type: string
 *                 format: uuid
 *               mois:
 *                 type: integer
 *               annee:
 *                 type: integer
 *     responses:
 *       200:
 *         description: PDF bulletin
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Worker not found
 */
router.post('/bulletin', authMiddleware, staffOnly, generateBulletinValidator, validate, salaryController.generateBulletinForWorker);

/**
 * @swagger
 * /api/salaries/worker/{workerId}/bulletin:
 *   get:
 *     summary: Generate PDF bulletin for a worker (auto-create salary if needed)
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: mois
 *         schema:
 *           type: integer
 *       - in: query
 *         name: annee
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF bulletin
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Worker not found
 */
router.get('/worker/:workerId/bulletin', authMiddleware, staffOnly, getBulletinValidator, validate, salaryController.generateBulletinForWorker);

/**
 * @swagger
 * /api/salaries/generate-month:
 *   post:
 *     summary: Generate salaries for all active workers for a month
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mois
 *               - annee
 *             properties:
 *               mois:
 *                 type: integer
 *                 example: 1
 *               annee:
 *                 type: integer
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Monthly salaries generated
 *       403:
 *         description: Admin only
 */
router.post('/generate-month', authMiddleware, adminOnly, generateMonthValidator, validate, salaryController.generateMonthSalaries);

/**
 * @swagger
 * /api/salaries/worker/{workerId}:
 *   get:
 *     summary: Get salary history for a worker
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Worker's salary history
 *       404:
 *         description: Worker not found
 */
router.get('/worker/:workerId', authMiddleware, staffOnly, workerSalariesValidator, validate, salaryController.getWorkerSalaries);

/**
 * @swagger
 * /api/salaries/{id}:
 *   get:
 *     summary: Get salary by ID
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Salary details
 *       404:
 *         description: Salary not found
 */
router.get('/:id', authMiddleware, staffOnly, salaryIdValidator, validate, salaryController.getSalaryById);

/**
 * @swagger
 * /api/salaries/{id}:
 *   put:
 *     summary: Update salary
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primes:
 *                 type: number
 *               deductions:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Salary updated
 *       400:
 *         description: Cannot modify paid salary
 *       404:
 *         description: Salary not found
 */
router.put('/:id', authMiddleware, staffOnly, updateSalaryValidator, validate, salaryController.updateSalary);

/**
 * @swagger
 * /api/salaries/{id}/pay:
 *   patch:
 *     summary: Mark salary as paid
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode_paiement:
 *                 type: string
 *                 enum: [ESPECES, VIREMENT, CHEQUE]
 *               reference_paiement:
 *                 type: string
 *     responses:
 *       200:
 *         description: Salary marked as paid
 *       400:
 *         description: Already paid
 *       404:
 *         description: Salary not found
 */
router.patch('/:id/pay', authMiddleware, staffOnly, paySalaryValidator, validate, salaryController.paySalary);

/**
 * @swagger
 * /api/salaries/{id}/cancel-payment:
 *   patch:
 *     summary: Cancel salary payment
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment cancelled
 *       400:
 *         description: Not a paid salary
 *       403:
 *         description: Admin only
 *       404:
 *         description: Salary not found
 */
router.patch('/:id/cancel-payment', authMiddleware, adminOnly, salaryIdValidator, validate, salaryController.cancelPayment);

/**
 * @swagger
 * /api/salaries/{id}/bulletin:
 *   get:
 *     summary: Generate and download salary bulletin PDF
 *     tags: [Salaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF bulletin
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Salary not found
 */
router.get('/:id/bulletin', authMiddleware, staffOnly, salaryIdValidator, validate, salaryController.generateBulletin);

module.exports = router;

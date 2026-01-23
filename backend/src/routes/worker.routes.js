const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const { workerController, importController } = require('../controllers');
const { authMiddleware, staffOnly, adminOnly, validate } = require('../middlewares');
const {
    createWorkerValidator,
    updateWorkerValidator,
    workerIdValidator,
    listWorkersValidator
} = require('../validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     Worker:
 *       type: object
 *       required:
 *         - nom
 *         - prenom
 *         - poste
 *         - date_embauche
 *         - salaire_base
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nom:
 *           type: string
 *         prenom:
 *           type: string
 *         poste:
 *           type: string
 *         contact:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         date_embauche:
 *           type: string
 *           format: date
 *         salaire_base:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [ACTIF, INACTIF, SUSPENDU]
 *         site_affectation:
 *           type: string
 *         cin:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/workers:
 *   post:
 *     summary: Create a new worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - poste
 *               - date_embauche
 *               - salaire_base
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Mohammed
 *               prenom:
 *                 type: string
 *                 example: Ali
 *               poste:
 *                 type: string
 *                 example: Agent de nettoyage
 *               contact:
 *                 type: string
 *                 example: "+212612345678"
 *               email:
 *                 type: string
 *                 format: email
 *               date_embauche:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               salaire_base:
 *                 type: number
 *                 example: 3500
 *               site_affectation:
 *                 type: string
 *                 example: Site A
 *               cin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Worker created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/', authMiddleware, staffOnly, createWorkerValidator, validate, workerController.createWorker);

/**
 * @swagger
 * /api/workers/import:
 *   post:
 *     summary: Import workers from Excel file
 *     tags: [Workers]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import successful
 */
router.post('/import', authMiddleware, staffOnly, upload.single('file'), importController.importWorkers);

/**
 * @swagger
 * /api/workers:
 *   get:
 *     summary: Get all workers with filters and pagination
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [ACTIF, INACTIF, SUSPENDU]
 *       - in: query
 *         name: site
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: poste
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 */
router.get('/', authMiddleware, staffOnly, listWorkersValidator, validate, workerController.getWorkers);

/**
 * @swagger
 * /api/workers/stats:
 *   get:
 *     summary: Get worker statistics
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker statistics
 */
router.get('/stats', authMiddleware, staffOnly, workerController.getWorkerStats);

/**
 * @swagger
 * /api/workers/{id}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Workers]
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
 *         description: Worker details
 *       404:
 *         description: Worker not found
 */
router.get('/:id', authMiddleware, staffOnly, workerIdValidator, validate, workerController.getWorkerById);

/**
 * @swagger
 * /api/workers/{id}:
 *   put:
 *     summary: Update worker
 *     tags: [Workers]
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
 *             $ref: '#/components/schemas/Worker'
 *     responses:
 *       200:
 *         description: Worker updated
 *       404:
 *         description: Worker not found
 */
router.put('/:id', authMiddleware, staffOnly, updateWorkerValidator, validate, workerController.updateWorker);

/**
 * @swagger
 * /api/workers/{id}/status:
 *   patch:
 *     summary: Update worker status
 *     tags: [Workers]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [ACTIF, INACTIF, SUSPENDU]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Worker not found
 */
router.patch('/:id/status', authMiddleware, staffOnly, workerIdValidator, validate, workerController.updateWorkerStatus);

/**
 * @swagger
 * /api/workers/{id}:
 *   delete:
 *     summary: Delete worker (soft delete)
 *     tags: [Workers]
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
 *         description: Worker deleted
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: Worker not found
 */
router.delete('/:id', authMiddleware, adminOnly, workerIdValidator, validate, workerController.deleteWorker);

module.exports = router;

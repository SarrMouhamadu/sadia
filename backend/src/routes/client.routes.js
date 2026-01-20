const express = require('express');
const router = express.Router();
const { clientController } = require('../controllers');
const { authMiddleware, adminOnly, validate } = require('../middlewares');
const {
    createClientValidator,
    updateClientValidator,
    clientIdValidator,
    listClientsValidator,
    createPaymentValidator,
    updatePaymentValidator,
    paymentIdValidator,
    receiptQueryValidator
} = require('../validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - nom
 *         - prix_contrat
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nom:
 *           type: string
 *         site:
 *           type: string
 *         telephone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         contact_principal:
 *           type: string
 *         type_contrat:
 *           type: string
 *         prix_contrat:
 *           type: number
 *         montant_paye:
 *           type: number
 *         montant_du:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [EN_COURS, TERMINE, SUSPENDU]
 *     Payment:
 *       type: object
 *       required:
 *         - montant
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         client_id:
 *           type: string
 *           format: uuid
 *         montant:
 *           type: number
 *         date_paiement:
 *           type: string
 *           format: date
 *         mois:
 *           type: integer
 *         annee:
 *           type: integer
 *         mode_paiement:
 *           type: string
 *           enum: [ESPECES, VIREMENT, CHEQUE, CARTE]
 *         reference:
 *           type: string
 */

// ============================================
// CLIENT ROUTES (Admin only)
// ============================================

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client (Admin only)
 *     tags: [Clients]
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
 *               - prix_contrat
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Entreprise ABC
 *               site:
 *                 type: string
 *                 example: Casablanca
 *               telephone:
 *                 type: string
 *                 example: "+212612345678"
 *               email:
 *                 type: string
 *                 format: email
 *               contact_principal:
 *                 type: string
 *               type_contrat:
 *                 type: string
 *                 example: Mensuel
 *               prix_contrat:
 *                 type: number
 *                 example: 15000
 *               date_debut:
 *                 type: string
 *                 format: date
 *               date_fin:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Client created
 *       403:
 *         description: Admin only
 */
router.post('/', authMiddleware, adminOnly, createClientValidator, validate, clientController.createClient);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients (Admin only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EN_COURS, TERMINE, SUSPENDU]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: List of clients
 *       403:
 *         description: Admin only
 */
router.get('/', authMiddleware, adminOnly, listClientsValidator, validate, clientController.getClients);

/**
 * @swagger
 * /api/clients/stats:
 *   get:
 *     summary: Get client statistics (Admin only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client statistics
 *       403:
 *         description: Admin only
 */
router.get('/stats', authMiddleware, adminOnly, clientController.getClientStats);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID with payment history (Admin only)
 *     tags: [Clients]
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
 *         description: Client details
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.get('/:id', authMiddleware, adminOnly, clientIdValidator, validate, clientController.getClientById);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update client (Admin only)
 *     tags: [Clients]
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
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client updated
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.put('/:id', authMiddleware, adminOnly, updateClientValidator, validate, clientController.updateClient);

/**
 * @swagger
 * /api/clients/{id}/status:
 *   patch:
 *     summary: Update client status (Admin only)
 *     tags: [Clients]
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
 *                 enum: [EN_COURS, TERMINE, SUSPENDU]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.patch('/:id/status', authMiddleware, adminOnly, clientIdValidator, validate, clientController.updateClientStatus);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client (Admin only)
 *     tags: [Clients]
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
 *         description: Client deleted
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.delete('/:id', authMiddleware, adminOnly, clientIdValidator, validate, clientController.deleteClient);

// ============================================
// PAYMENT ROUTES (Admin only)
// ============================================

/**
 * @swagger
 * /api/clients/{id}/payments:
 *   post:
 *     summary: Create payment for client (Admin only)
 *     tags: [Payments]
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
 *               - montant
 *             properties:
 *               montant:
 *                 type: number
 *                 example: 5000
 *               date_paiement:
 *                 type: string
 *                 format: date
 *               mois:
 *                 type: integer
 *               annee:
 *                 type: integer
 *               mode_paiement:
 *                 type: string
 *                 enum: [ESPECES, VIREMENT, CHEQUE, CARTE]
 *               reference:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.post('/:id/payments', authMiddleware, adminOnly, createPaymentValidator, validate, clientController.createPayment);

/**
 * @swagger
 * /api/clients/{id}/payments:
 *   get:
 *     summary: Get payments for a client (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: List of payments
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.get('/:id/payments', authMiddleware, adminOnly, clientIdValidator, validate, clientController.getClientPayments);

/**
 * @swagger
 * /api/clients/{id}/receipt:
 *   get:
 *     summary: Generate receipt PDF for client (Admin only)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: PDF receipt
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Admin only
 *       404:
 *         description: Client not found
 */
router.get('/:id/receipt', authMiddleware, adminOnly, receiptQueryValidator, validate, clientController.generateReceipt);

module.exports = router;

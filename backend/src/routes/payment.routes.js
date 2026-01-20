const express = require('express');
const router = express.Router();
const { clientController } = require('../controllers');
const { authMiddleware, adminOnly, validate } = require('../middlewares');
const { updatePaymentValidator, paymentIdValidator } = require('../validators');

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Update payment (Admin only)
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               montant:
 *                 type: number
 *               mode_paiement:
 *                 type: string
 *                 enum: [ESPECES, VIREMENT, CHEQUE, CARTE]
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated
 *       403:
 *         description: Admin only
 *       404:
 *         description: Payment not found
 */
router.put('/:id', authMiddleware, adminOnly, updatePaymentValidator, validate, clientController.updatePayment);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Delete payment (Admin only)
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
 *     responses:
 *       200:
 *         description: Payment deleted
 *       403:
 *         description: Admin only
 *       404:
 *         description: Payment not found
 */
router.delete('/:id', authMiddleware, adminOnly, paymentIdValidator, validate, clientController.deletePayment);

module.exports = router;

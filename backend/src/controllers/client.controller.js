const { Op } = require('sequelize');
const { Client, Payment, User } = require('../models');
const { sequelize } = require('../config/database');
const { asyncHandler, ApiResponse, ApiError, getPagination, getPagingData, logger } = require('../utils');
const pdfService = require('../services/pdf.service');

// ============================================
// CLIENT CONTROLLERS
// ============================================

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Admin only
 */
const createClient = asyncHandler(async (req, res) => {
    const clientData = {
        ...req.body,
        created_by: req.user.id
    };

    const client = await Client.create(clientData);

    logger.info(`Client created: ${client.nom} by ${req.user.email}`);

    ApiResponse.created(res, { client }, 'Client créé avec succès');
});

/**
 * @desc    Get all clients with filters
 * @route   GET /api/clients
 * @access  Admin only
 */
const getClients = asyncHandler(async (req, res) => {
    const { page, limit, statut, search } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const where = {};

    if (statut) where.statut = statut;
    if (search) {
        where[Op.or] = [
            { nom: { [Op.iLike]: `%${search}%` } },
            { site: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }

    const data = await Client.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'nom', 'prenom']
        }],
        order: [['created_at', 'DESC']]
    });

    // Add montant_du virtual field
    const items = data.rows.map(client => ({
        ...client.toJSON(),
        montant_du: parseFloat(client.prix_contrat) - parseFloat(client.montant_paye)
    }));

    const { pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, items, pagination);
});

/**
 * @desc    Get client by ID with payment history
 * @route   GET /api/clients/:id
 * @access  Admin only
 */
const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findByPk(req.params.id, {
        include: [
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'nom', 'prenom']
            },
            {
                model: Payment,
                as: 'payments',
                order: [['date_paiement', 'DESC']],
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'nom', 'prenom']
                }]
            }
        ]
    });

    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    const clientData = {
        ...client.toJSON(),
        montant_du: parseFloat(client.prix_contrat) - parseFloat(client.montant_paye)
    };

    ApiResponse.success(res, { client: clientData });
});

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Admin only
 */
const updateClient = asyncHandler(async (req, res) => {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    const { created_by, deleted_at, ...updateData } = req.body;

    await client.update(updateData);

    logger.info(`Client updated: ${client.nom} by ${req.user.email}`);

    ApiResponse.success(res, {
        client: {
            ...client.toJSON(),
            montant_du: parseFloat(client.prix_contrat) - parseFloat(client.montant_paye)
        }
    }, 'Client mis à jour avec succès');
});

/**
 * @desc    Update client status
 * @route   PATCH /api/clients/:id/status
 * @access  Admin only
 */
const updateClientStatus = asyncHandler(async (req, res) => {
    const { statut } = req.body;

    if (!['EN_COURS', 'TERMINE', 'SUSPENDU'].includes(statut)) {
        throw ApiError.badRequest('Statut invalide');
    }

    const client = await Client.findByPk(req.params.id);

    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    client.statut = statut;
    await client.save();

    logger.info(`Client status changed: ${client.nom} -> ${statut} by ${req.user.email}`);

    ApiResponse.success(res, { client }, 'Statut mis à jour avec succès');
});

/**
 * @desc    Soft delete client
 * @route   DELETE /api/clients/:id
 * @access  Admin only
 */
const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    await client.destroy();

    logger.info(`Client deleted: ${client.nom} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Client supprimé avec succès');
});

/**
 * @desc    Get client statistics
 * @route   GET /api/clients/stats
 * @access  Admin only
 */
const getClientStats = asyncHandler(async (req, res) => {
    const [total, enCours, termine, suspendu] = await Promise.all([
        Client.count(),
        Client.count({ where: { statut: 'EN_COURS' } }),
        Client.count({ where: { statut: 'TERMINE' } }),
        Client.count({ where: { statut: 'SUSPENDU' } })
    ]);

    const [totalContrats, totalPaye] = await Promise.all([
        Client.sum('prix_contrat'),
        Client.sum('montant_paye')
    ]);

    ApiResponse.success(res, {
        stats: {
            total,
            enCours,
            termine,
            suspendu,
            totalContrats: totalContrats || 0,
            totalPaye: totalPaye || 0,
            totalDu: (totalContrats || 0) - (totalPaye || 0)
        }
    });
});

// ============================================
// PAYMENT CONTROLLERS
// ============================================

/**
 * @desc    Create payment for client
 * @route   POST /api/clients/:id/payments
 * @access  Admin only
 */
const createPayment = asyncHandler(async (req, res) => {
    const clientId = req.params.id;

    const client = await Client.findByPk(clientId);
    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    const paymentData = {
        ...req.body,
        client_id: clientId,
        created_by: req.user.id
    };

    const payment = await Payment.create(paymentData);

    // Update client montant_paye
    const newMontantPaye = parseFloat(client.montant_paye) + parseFloat(payment.montant);
    client.montant_paye = newMontantPaye;
    await client.save();

    logger.info(`Payment created for client ${client.nom}: ${payment.montant} by ${req.user.email}`);

    ApiResponse.created(res, {
        payment,
        client: {
            ...client.toJSON(),
            montant_du: parseFloat(client.prix_contrat) - newMontantPaye
        }
    }, 'Paiement enregistré avec succès');
});

/**
 * @desc    Get payments for a client
 * @route   GET /api/clients/:id/payments
 * @access  Admin only
 */
const getClientPayments = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const client = await Client.findByPk(req.params.id);
    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    const data = await Payment.findAndCountAll({
        where: { client_id: req.params.id },
        limit: limitNum,
        offset,
        include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'nom', 'prenom']
        }],
        order: [['date_paiement', 'DESC']]
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, { client, payments: items }, pagination);
});

/**
 * @desc    Update payment
 * @route   PUT /api/payments/:id
 * @access  Admin only
 */
const updatePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByPk(req.params.id, {
        include: [{ model: Client, as: 'client' }]
    });

    if (!payment) {
        throw ApiError.notFound('Paiement non trouvé');
    }

    const oldAmount = parseFloat(payment.montant);
    const { client_id, created_by, ...updateData } = req.body;

    await payment.update(updateData);

    // Adjust client montant_paye if amount changed
    if (updateData.montant && parseFloat(updateData.montant) !== oldAmount) {
        const difference = parseFloat(updateData.montant) - oldAmount;
        payment.client.montant_paye = parseFloat(payment.client.montant_paye) + difference;
        await payment.client.save();
    }

    ApiResponse.success(res, { payment }, 'Paiement mis à jour avec succès');
});

/**
 * @desc    Delete payment
 * @route   DELETE /api/payments/:id
 * @access  Admin only
 */
const deletePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findByPk(req.params.id, {
        include: [{ model: Client, as: 'client' }]
    });

    if (!payment) {
        throw ApiError.notFound('Paiement non trouvé');
    }

    // Reduce client montant_paye
    payment.client.montant_paye = parseFloat(payment.client.montant_paye) - parseFloat(payment.montant);
    await payment.client.save();

    await payment.destroy();

    logger.info(`Payment deleted for client ${payment.client.nom}: ${payment.montant} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Paiement supprimé avec succès');
});

/**
 * @desc    Generate receipt PDF for client
 * @route   GET /api/clients/:id/receipt
 * @access  Admin only
 */
const generateReceipt = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    const client = await Client.findByPk(req.params.id, {
        include: [{
            model: Payment,
            as: 'payments',
            where: month && year ? {
                mois: parseInt(month),
                annee: parseInt(year)
            } : {},
            required: false
        }]
    });

    if (!client) {
        throw ApiError.notFound('Client non trouvé');
    }

    const pdfBuffer = await pdfService.generateClientReceipt(client, month, year);

    const filename = month && year
        ? `recu_${client.nom}_${month}_${year}.pdf`
        : `recu_${client.nom}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfBuffer);
});

module.exports = {
    // Clients
    createClient,
    getClients,
    getClientById,
    updateClient,
    updateClientStatus,
    deleteClient,
    getClientStats,
    // Payments
    createPayment,
    getClientPayments,
    updatePayment,
    deletePayment,
    generateReceipt
};

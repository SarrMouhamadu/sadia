const { Op } = require('sequelize');
const { Worker, Salary, Product, Client, Notification, User, StockMovement, Payment } = require('../models');
const { asyncHandler, ApiResponse, ApiError, getPagination, getPagingData } = require('../utils');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Admin, Assistant
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    const mois = parseInt(month) || new Date().getMonth() + 1;
    const annee = parseInt(year) || new Date().getFullYear();

    // Worker stats
    const [totalWorkers, activeWorkers] = await Promise.all([
        Worker.count(),
        Worker.count({ where: { statut: 'ACTIF' } })
    ]);

    // Salary stats for the month
    const [salaryTotal, salaryPaid, salaryPending] = await Promise.all([
        Salary.sum('salaire_net', { where: { mois, annee } }),
        Salary.sum('salaire_net', { where: { mois, annee, statut: 'PAYE' } }),
        Salary.count({ where: { mois, annee, statut: 'EN_ATTENTE' } })
    ]);

    // Stock stats
    const [totalProducts, stockAlerts, stockRupture] = await Promise.all([
        Product.count({ where: { is_active: true } }),
        Product.count({ where: { is_active: true, statut: 'ALERTE' } }),
        Product.count({ where: { is_active: true, statut: 'RUPTURE' } })
    ]);

    // Base stats
    const stats = {
        period: { mois, annee },
        workers: {
            total: totalWorkers,
            actifs: activeWorkers
        },
        salaries: {
            total: Number(salaryTotal) || 0,
            paye: Number(salaryPaid) || 0,
            enAttente: salaryPending,
            restant: (Number(salaryTotal) || 0) - (Number(salaryPaid) || 0)
        },
        stock: {
            totalProducts,
            alertes: stockAlerts,
            ruptures: stockRupture
        }
    };

    // Add client stats for Admin only
    if (req.user.role === 'ADMIN') {
        const [totalClients, activeClients, totalContrats, totalPaye] = await Promise.all([
            Client.count(),
            Client.count({ where: { statut: 'EN_COURS' } }),
            Client.sum('prix_contrat'),
            Client.sum('montant_paye')
        ]);

        stats.clients = {
            total: totalClients,
            enCours: activeClients,
            totalContrats: Number(totalContrats) || 0,
            totalPaye: Number(totalPaye) || 0,
            totalDu: (Number(totalContrats) || 0) - (Number(totalPaye) || 0)
        };
    }

    // Stock alerts (products in alert/rupture)
    const alertProducts = await Product.findAll({
        where: {
            is_active: true,
            statut: { [Op.in]: ['ALERTE', 'RUPTURE'] }
        },
        attributes: ['id', 'nom', 'quantite_actuelle', 'seuil_alerte', 'statut'],
        limit: 10,
        order: [
            [require('sequelize').literal("CASE WHEN statut = 'RUPTURE' THEN 1 ELSE 2 END"), 'ASC']
        ]
    });

    stats.alertProducts = alertProducts;

    ApiResponse.success(res, { stats });
});

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/activities
 * @access  Admin, Assistant
 */
const getRecentActivities = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // Get recent stock movements
    const stockMovements = await StockMovement.findAll({
        include: [
            {
                model: Product,
                as: 'product',
                attributes: ['id', 'nom']
            },
            {
                model: User,
                as: 'user',
                attributes: ['id', 'nom', 'prenom']
            }
        ],
        order: [['created_at', 'DESC']],
        limit: limitNum
    });

    // Get recent salary payments
    const salaryPayments = await Salary.findAll({
        where: {
            statut: 'PAYE',
            date_paiement: { [Op.not]: null }
        },
        include: [
            {
                model: Worker,
                as: 'worker',
                attributes: ['id', 'nom', 'prenom']
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'nom', 'prenom']
            }
        ],
        order: [['date_paiement', 'DESC']],
        limit: limitNum
    });

    // Get recent client payments (Admin only)
    let clientPayments = [];
    if (req.user.role === 'ADMIN') {
        clientPayments = await Payment.findAll({
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'nom']
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'nom', 'prenom']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: limitNum
        });
    }

    // Transform and combine activities
    const activities = [];

    // Add stock movements
    stockMovements.forEach(movement => {
        activities.push({
            id: movement.id,
            type: movement.type === 'ENTREE' ? 'STOCK_IN' : 'STOCK_OUT',
            title: movement.type === 'ENTREE' ? 'Entrée de stock' : 'Sortie de stock',
            description: `${movement.quantite} ${movement.product?.nom || 'Produit'}`,
            details: movement.type === 'ENTREE'
                ? (movement.source || 'Fournisseur')
                : (movement.destination || 'Destination'),
            user: movement.user ? `${movement.user.prenom} ${movement.user.nom}` : null,
            amount: null,
            date: movement.created_at,
            icon: movement.type === 'ENTREE' ? 'package-plus' : 'package-minus',
            color: movement.type === 'ENTREE' ? 'emerald' : 'orange'
        });
    });

    // Add salary payments
    salaryPayments.forEach(salary => {
        activities.push({
            id: salary.id,
            type: 'SALARY_PAYMENT',
            title: 'Paiement salaire',
            description: salary.worker ? `${salary.worker.prenom} ${salary.worker.nom}` : 'Employé',
            details: `${salary.mois}/${salary.annee}`,
            user: salary.creator ? `${salary.creator.prenom} ${salary.creator.nom}` : null,
            amount: parseFloat(salary.salaire_net),
            date: salary.date_paiement,
            icon: 'wallet',
            color: 'blue'
        });
    });

    // Add client payments (Admin only)
    clientPayments.forEach(payment => {
        activities.push({
            id: payment.id,
            type: 'CLIENT_PAYMENT',
            title: 'Paiement client',
            description: payment.client?.nom || 'Client',
            details: payment.mode_paiement,
            user: payment.creator ? `${payment.creator.prenom} ${payment.creator.nom}` : null,
            amount: parseFloat(payment.montant),
            date: payment.created_at,
            icon: 'building',
            color: 'purple'
        });
    });

    // Sort all activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return only the most recent ones
    const recentActivities = activities.slice(0, limitNum);

    ApiResponse.success(res, { activities: recentActivities });
});

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
    const { page, limit, type } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const where = {
        [Op.or]: [
            { user_id: req.user.id },
            { user_id: null }
        ]
    };

    if (type) where.type = type;

    const data = await Notification.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [['created_at', 'DESC']]
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, items, pagination);
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/notifications/unread
 * @access  Private
 */
const getUnreadNotifications = asyncHandler(async (req, res) => {
    const where = {
        is_read: false,
        [Op.or]: [
            { user_id: req.user.id },
            { user_id: null }
        ]
    };

    const notifications = await Notification.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: 20
    });

    const count = await Notification.count({ where });

    ApiResponse.success(res, {
        count,
        notifications
    });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
        throw ApiError.notFound('Notification non trouvée');
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    ApiResponse.success(res, { notification }, 'Notification marquée comme lue');
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.update(
        { is_read: true, read_at: new Date() },
        {
            where: {
                is_read: false,
                [Op.or]: [
                    { user_id: req.user.id },
                    { user_id: null }
                ]
            }
        }
    );

    ApiResponse.success(res, null, 'Toutes les notifications marquées comme lues');
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
        throw ApiError.notFound('Notification non trouvée');
    }

    await notification.destroy();

    ApiResponse.success(res, null, 'Notification supprimée');
});

module.exports = {
    getDashboardStats,
    getRecentActivities,
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};

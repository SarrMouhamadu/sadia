const { Op } = require('sequelize');
const { Worker, User, Salary } = require('../models');
const { asyncHandler, ApiResponse, ApiError, getPagination, getPagingData, logger } = require('../utils');

/**
 * @desc    Create a new worker
 * @route   POST /api/workers
 * @access  Admin, Assistant
 */
const createWorker = asyncHandler(async (req, res) => {
    const workerData = {
        ...req.body,
        created_by: req.user.id
    };

    const worker = await Worker.create(workerData);

    // Auto-create salary for the current month
    const today = new Date();
    const mois = today.getMonth() + 1;
    const annee = today.getFullYear();

    await Salary.create({
        worker_id: worker.id,
        mois,
        annee,
        salaire_base: worker.salaire_base,
        primes: 0,
        deductions: 0,
        statut: 'EN_ATTENTE',
        created_by: req.user.id
    });

    logger.info(`Worker created: ${worker.nom} ${worker.prenom} by ${req.user.email}`);

    ApiResponse.created(res, { worker }, 'Travailleur créé avec succès');
});

/**
 * @desc    Get all workers with filters and pagination
 * @route   GET /api/workers
 * @access  Admin, Assistant
 */
const getWorkers = asyncHandler(async (req, res) => {
    const { page, limit, statut, site, search, poste, month, year, paymentStatus } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    // Build where clause for Worker
    const where = {};

    if (statut) {
        where.statut = statut;
    }

    if (site) {
        where.site_affectation = { [Op.iLike]: `%${site}%` };
    }

    if (poste) {
        where.poste = { [Op.iLike]: `%${poste}%` };
    }

    if (search) {
        where[Op.or] = [
            { nom: { [Op.iLike]: `%${search}%` } },
            { prenom: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { cin: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // Build include for Salary
    const salaryInclude = {
        model: Salary,
        as: 'salaries',
        required: false,
    };

    // If month/year provided, filter the specific salary record
    const salaryWhere = {};
    if (month) salaryWhere.mois = parseInt(month);
    if (year) salaryWhere.annee = parseInt(year);

    if (Object.keys(salaryWhere).length > 0) {
        salaryInclude.where = salaryWhere;
    }

    // Handle payment status filter
    if (paymentStatus) {
        if (paymentStatus === 'NOT_CREATED') {
            // Workers who DON'T have a salary record for the given month/year
            // This is tricky with Sequelize findAndCountAll and pagination if we use literal SQL
            // But if we want workers with NO salary, we can use Op.notIn or check for null on the join
            salaryInclude.required = false;
            // We'll filter workers where the salary join results in null
            // However, Sequelize doesn't easily allow filtering by null on a LEFT JOINed include in 'where' 
            // without using sequelize.literal or specific syntax.
            where['$salaries.id$'] = null;
        } else {
            salaryInclude.required = true;
            salaryWhere.statut = paymentStatus;
        }
    }

    const data = await Worker.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        include: [
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'nom', 'prenom', 'email']
            },
            salaryInclude
        ],
        order: [['created_at', 'DESC']],
        distinct: true // Important when using includes to get correct count
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, items, pagination);
});

/**
 * @desc    Get worker by ID
 * @route   GET /api/workers/:id
 * @access  Admin, Assistant
 */
const getWorkerById = asyncHandler(async (req, res) => {
    const worker = await Worker.findByPk(req.params.id, {
        include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'nom', 'prenom', 'email']
        }]
    });

    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    ApiResponse.success(res, { worker });
});

/**
 * @desc    Update worker
 * @route   PUT /api/workers/:id
 * @access  Admin, Assistant
 */
const updateWorker = asyncHandler(async (req, res) => {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    // Don't allow updating certain fields
    const { created_by, deleted_at, ...updateData } = req.body;

    const previousBase = parseFloat(worker.salaire_base || 0);

    await worker.update(updateData);

    // If base salary changed, update pending salary records for this worker
    if (updateData.hasOwnProperty('salaire_base')) {
        const newBase = parseFloat(updateData.salaire_base || 0);
        if (!isNaN(newBase) && newBase !== previousBase) {
            // Find all pending salaries for this worker
            const pendingSalaries = await Salary.findAll({
                where: {
                    worker_id: worker.id,
                    statut: 'EN_ATTENTE'
                }
            });

            // Update each salary individually and force net salary recalculation
            for (const salary of pendingSalaries) {
                salary.salaire_base = newBase;
                const base = parseFloat(salary.salaire_base) || 0;
                const primes = parseFloat(salary.primes) || 0;
                const deductions = parseFloat(salary.deductions) || 0;
                salary.salaire_net = base + primes - deductions;
                await salary.save(); 
            }

            logger.info(`Updated ${pendingSalaries.length} pending salaries for worker ${worker.nom} ${worker.prenom} to new base ${newBase}`);
        }
    }

    logger.info(`Worker updated: ${worker.nom} ${worker.prenom} by ${req.user.email}`);

    ApiResponse.success(res, { worker }, 'Travailleur mis à jour avec succès');
});

/**
 * @desc    Update worker status
 * @route   PATCH /api/workers/:id/status
 * @access  Admin, Assistant
 */
const updateWorkerStatus = asyncHandler(async (req, res) => {
    const { statut } = req.body;

    if (!['ACTIF', 'INACTIF', 'SUSPENDU'].includes(statut)) {
        throw ApiError.badRequest('Statut invalide');
    }

    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    worker.statut = statut;
    await worker.save();

    logger.info(`Worker status changed: ${worker.nom} ${worker.prenom} -> ${statut} by ${req.user.email}`);

    ApiResponse.success(res, { worker }, 'Statut mis à jour avec succès');
});

/**
 * @desc    Soft delete worker
 * @route   DELETE /api/workers/:id
 * @access  Admin
 */
const deleteWorker = asyncHandler(async (req, res) => {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    await worker.destroy(); // Soft delete (paranoid)

    logger.info(`Worker deleted: ${worker.nom} ${worker.prenom} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Travailleur supprimé avec succès');
});

/**
 * @desc    Get worker statistics
 * @route   GET /api/workers/stats
 * @access  Admin, Assistant
 */
const getWorkerStats = asyncHandler(async (req, res) => {
    const [total, actifs, inactifs, suspendus] = await Promise.all([
        Worker.count(),
        Worker.count({ where: { statut: 'ACTIF' } }),
        Worker.count({ where: { statut: 'INACTIF' } }),
        Worker.count({ where: { statut: 'SUSPENDU' } })
    ]);

    // Workers by site
    const bySite = await Worker.findAll({
        attributes: [
            'site_affectation',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: { statut: 'ACTIF' },
        group: ['site_affectation'],
        raw: true
    });

    // Workers by poste
    const byPoste = await Worker.findAll({
        attributes: [
            'poste',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: { statut: 'ACTIF' },
        group: ['poste'],
        raw: true
    });

    ApiResponse.success(res, {
        stats: {
            total,
            actifs,
            inactifs,
            suspendus,
            bySite,
            byPoste
        }
    });
});

module.exports = {
    createWorker,
    getWorkers,
    getWorkerById,
    updateWorker,
    updateWorkerStatus,
    deleteWorker,
    getWorkerStats
};

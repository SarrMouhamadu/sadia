const { Op } = require('sequelize');
const { Salary, Worker, User } = require('../models');
const { asyncHandler, ApiResponse, ApiError, getPagination, getPagingData, logger } = require('../utils');
const pdfService = require('../services/pdf.service');

/**
 * @desc    Create a new salary record
 * @route   POST /api/salaries
 * @access  Admin, Assistant
 */
const createSalary = asyncHandler(async (req, res) => {
    const { worker_id, mois, annee } = req.body;

    // Check if worker exists
    const worker = await Worker.findByPk(worker_id);
    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    // Check if salary already exists for this month
    const existingSalary = await Salary.findOne({
        where: { worker_id, mois, annee }
    });

    if (existingSalary) {
        throw ApiError.conflict('Un salaire existe déjà pour ce mois');
    }

    const salaryData = {
        ...req.body,
        salaire_base: req.body.salaire_base || worker.salaire_base,
        created_by: req.user.id
    };

    const salary = await Salary.create(salaryData);

    logger.info(`Salary created for worker ${worker.nom} ${worker.prenom} - ${mois}/${annee} by ${req.user.email}`);

    ApiResponse.created(res, { salary }, 'Salaire créé avec succès');
});

/**
 * @desc    Get all salaries with filters
 * @route   GET /api/salaries
 * @access  Admin, Assistant
 */
const getSalaries = asyncHandler(async (req, res) => {
    const { page, limit, month, year, statut, worker_id } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const where = {};

    if (month) where.mois = parseInt(month);
    if (year) where.annee = parseInt(year);
    if (statut) where.statut = statut;
    if (worker_id) where.worker_id = worker_id;

    const data = await Salary.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        include: [{
            model: Worker,
            as: 'worker',
            attributes: ['id', 'nom', 'prenom', 'poste', 'site_affectation']
        }],
        order: [['annee', 'DESC'], ['mois', 'DESC'], ['created_at', 'DESC']]
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, items, pagination);
});

/**
 * @desc    Get salary by ID
 * @route   GET /api/salaries/:id
 * @access  Admin, Assistant
 */
const getSalaryById = asyncHandler(async (req, res) => {
    const salary = await Salary.findByPk(req.params.id, {
        include: [
            {
                model: Worker,
                as: 'worker',
                attributes: ['id', 'nom', 'prenom', 'poste', 'site_affectation', 'cin', 'contact']
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'nom', 'prenom']
            }
        ]
    });

    if (!salary) {
        throw ApiError.notFound('Salaire non trouvé');
    }

    ApiResponse.success(res, { salary });
});

/**
 * @desc    Update salary
 * @route   PUT /api/salaries/:id
 * @access  Admin, Assistant
 */
const updateSalary = asyncHandler(async (req, res) => {
    const salary = await Salary.findByPk(req.params.id);

    if (!salary) {
        throw ApiError.notFound('Salaire non trouvé');
    }

    if (salary.statut === 'PAYE') {
        throw ApiError.badRequest('Impossible de modifier un salaire déjà payé');
    }

    const { worker_id, mois, annee, created_by, ...updateData } = req.body;

    await salary.update(updateData);

    logger.info(`Salary updated: ${salary.id} by ${req.user.email}`);

    ApiResponse.success(res, { salary }, 'Salaire mis à jour avec succès');
});

/**
 * @desc    Mark salary as paid
 * @route   PATCH /api/salaries/:id/pay
 * @access  Admin, Assistant
 */
const paySalary = asyncHandler(async (req, res) => {
    const { mode_paiement, reference_paiement } = req.body;

    const salary = await Salary.findByPk(req.params.id, {
        include: [{ model: Worker, as: 'worker' }]
    });

    if (!salary) {
        throw ApiError.notFound('Salaire non trouvé');
    }

    if (salary.statut === 'PAYE') {
        throw ApiError.badRequest('Ce salaire est déjà payé');
    }

    salary.statut = 'PAYE';
    salary.date_paiement = new Date();
    if (mode_paiement) salary.mode_paiement = mode_paiement;
    if (reference_paiement) salary.reference_paiement = reference_paiement;

    await salary.save();

    // Ensure worker association is available for logging (worker may have been deleted)
    if (!salary.worker) {
        try {
            await salary.reload({ include: [{ model: Worker, as: 'worker' }] });
        } catch (e) {
            // ignore reload errors
        }
    }

    const workerName = salary.worker ? `${salary.worker.nom} ${salary.worker.prenom}` : 'N/A';
    logger.info(`Salary paid: ${workerName} - ${salary.mois}/${salary.annee} by ${req.user.email}`);

    ApiResponse.success(res, { salary }, 'Salaire marqué comme payé');
});

/**
 * @desc    Cancel salary payment
 * @route   PATCH /api/salaries/:id/cancel-payment
 * @access  Admin
 */
const cancelPayment = asyncHandler(async (req, res) => {
    const salary = await Salary.findByPk(req.params.id, {
        include: [{ model: Worker, as: 'worker' }]
    });

    if (!salary) {
        throw ApiError.notFound('Salaire non trouvé');
    }

    if (salary.statut !== 'PAYE') {
        throw ApiError.badRequest('Seul un salaire payé peut être annulé');
    }

    salary.statut = 'EN_ATTENTE';
    salary.date_paiement = null;
    salary.mode_paiement = null;
    salary.reference_paiement = null;

    await salary.save();

    const workerName = salary.worker ? `${salary.worker.nom} ${salary.worker.prenom}` : 'N/A';
    logger.info(`Payment cancelled: ${workerName} - ${salary.mois}/${salary.annee} by ${req.user.email}`);

    ApiResponse.success(res, { salary }, 'Paiement annulé avec succès');
});

/**
 * @desc    Get salary statistics for a month
 * @route   GET /api/salaries/stats
 * @access  Admin, Assistant
 */
const getSalaryStats = asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    const mois = parseInt(month) || new Date().getMonth() + 1;
    const annee = parseInt(year) || new Date().getFullYear();

    const where = { mois, annee };

    const [total, paye, enAttente, totalAmount, paidAmount] = await Promise.all([
        Salary.count({ where }),
        Salary.count({ where: { ...where, statut: 'PAYE' } }),
        Salary.count({ where: { ...where, statut: 'EN_ATTENTE' } }),
        Salary.sum('salaire_net', { where }),
        Salary.sum('salaire_net', { where: { ...where, statut: 'PAYE' } })
    ]);

    ApiResponse.success(res, {
        stats: {
            mois,
            annee,
            total,
            paye,
            enAttente,
            totalAmount: totalAmount || 0,
            paidAmount: paidAmount || 0,
            pendingAmount: (totalAmount || 0) - (paidAmount || 0)
        }
    });
});

/**
 * @desc    Get salary history for a worker
 * @route   GET /api/salaries/worker/:workerId
 * @access  Admin, Assistant
 */
const getWorkerSalaries = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { page, limit } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const worker = await Worker.findByPk(workerId);
    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    const data = await Salary.findAndCountAll({
        where: { worker_id: workerId },
        limit: limitNum,
        offset,
        order: [['annee', 'DESC'], ['mois', 'DESC']]
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, { worker, salaries: items }, pagination);
});

/**
 * @desc    Generate salary bulletin PDF
 * @route   GET /api/salaries/:id/bulletin
 * @access  Admin, Assistant
 */
const generateBulletin = asyncHandler(async (req, res) => {
    const salary = await Salary.findByPk(req.params.id, {
        include: [{
            model: Worker,
            as: 'worker',
            attributes: ['id', 'nom', 'prenom', 'poste', 'site_affectation', 'cin', 'date_embauche']
        }]
    });

    if (!salary) {
        throw ApiError.notFound('Salaire non trouvé');
    }

    const pdfBuffer = await pdfService.generateSalaryBulletin(salary);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin_${salary.worker.nom}_${salary.mois}_${salary.annee}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @desc    Generate salaries for all active workers for a month
 * @route   POST /api/salaries/generate-month
 * @access  Admin
 */
const generateMonthSalaries = asyncHandler(async (req, res) => {
    const { mois, annee } = req.body;

    // Get all active workers
    const workers = await Worker.findAll({
        where: { statut: 'ACTIF' }
    });

    if (workers.length === 0) {
        throw ApiError.badRequest('Aucun travailleur actif trouvé');
    }

    const created = [];
    const skipped = [];

    for (const worker of workers) {
        // Check if salary already exists
        const existing = await Salary.findOne({
            where: { worker_id: worker.id, mois, annee }
        });

        if (existing) {
            skipped.push({ worker: `${worker.nom} ${worker.prenom}`, reason: 'Salaire déjà existant' });
            continue;
        }

        const salary = await Salary.create({
            worker_id: worker.id,
            mois,
            annee,
            salaire_base: worker.salaire_base,
            primes: 0,
            deductions: 0,
            created_by: req.user.id
        });

        created.push(salary);
    }

    logger.info(`Monthly salaries generated: ${created.length} created, ${skipped.length} skipped for ${mois}/${annee} by ${req.user.email}`);

    ApiResponse.success(res, {
        created: created.length,
        skipped: skipped.length,
        details: { created, skipped }
    }, `${created.length} salaires générés avec succès`);
});

/**
 * @desc    Generate salary bulletin for a worker (create salary if needed)
 * @route   POST /api/salaries/bulletin
 * @access  Admin, Assistant
 */
const generateBulletinForWorker = asyncHandler(async (req, res) => {
    // Determine source of parameters (POST body vs GET params/query)
    const worker_id = req.body.worker_id || req.params.workerId;
    const reqMois = req.body.mois || req.query.mois;
    const reqAnnee = req.body.annee || req.query.annee;

    // Default to current month/year if not provided
    const today = new Date();
    const mois = reqMois ? parseInt(reqMois) : (today.getMonth() + 1);
    const annee = reqAnnee ? parseInt(reqAnnee) : today.getFullYear();

    if (!worker_id) {
        throw ApiError.badRequest('ID du travailleur requis');
    }

    // Check if worker exists
    const worker = await Worker.findByPk(worker_id);
    if (!worker) {
        throw ApiError.notFound('Travailleur non trouvé');
    }

    // Check if salary exists
    let salary = await Salary.findOne({
        where: { worker_id, mois, annee },
        include: [{
            model: Worker,
            as: 'worker',
            attributes: ['id', 'nom', 'prenom', 'poste', 'site_affectation', 'cin', 'date_embauche']
        }]
    });

    // If salary doesn't exist, create it
    if (!salary) {
        const salaryData = {
            worker_id,
            mois,
            annee,
            salaire_base: worker.salaire_base,
            primes: 0,
            deductions: 0,
            created_by: req.user.id
        };

        salary = await Salary.create(salaryData);

        // Reload to get worker association
        salary = await Salary.findByPk(salary.id, {
            include: [{
                model: Worker,
                as: 'worker',
                attributes: ['id', 'nom', 'prenom', 'poste', 'site_affectation', 'cin', 'date_embauche']
            }]
        });

        logger.info(`Salary auto-created for bulletin: ${worker.nom} ${worker.prenom} - ${mois}/${annee}`);
    }

    const pdfBuffer = await pdfService.generateSalaryBulletin(salary);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin_${salary.worker.nom}_${salary.mois}_${salary.annee}.pdf`);
    res.send(pdfBuffer);
});

module.exports = {
    createSalary,
    getSalaries,
    getSalaryById,
    updateSalary,
    paySalary,
    getSalaryStats,
    getWorkerSalaries,
    generateBulletin,
    generateMonthSalaries,
    generateBulletinForWorker,
    cancelPayment
};

const { Op } = require('sequelize');
const { Category, Product, StockMovement, User, Notification } = require('../models');
const { sequelize } = require('../config/database');
const { asyncHandler, ApiResponse, ApiError, getPagination, getPagingData, logger } = require('../utils');
const notificationService = require('../services/notification.service');

// ============================================
// CATEGORY CONTROLLERS
// ============================================

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Admin, Assistant
 */
const createCategory = asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);

    logger.info(`Category created: ${category.nom} by ${req.user.email}`);

    ApiResponse.created(res, { category }, 'Catégorie créée avec succès');
});

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Admin, Assistant
 */
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.findAll({
        where: { is_active: true },
        include: [{
            model: Product,
            as: 'products',
            attributes: ['id']
        }],
        order: [['nom', 'ASC']]
    });

    // Add product count
    const categoriesWithCount = categories.map(cat => ({
        ...cat.toJSON(),
        productCount: cat.products.length
    }));

    ApiResponse.success(res, { categories: categoriesWithCount });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin, Assistant
 */
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        throw ApiError.notFound('Catégorie non trouvée');
    }

    await category.update(req.body);

    ApiResponse.success(res, { category }, 'Catégorie mise à jour avec succès');
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id, {
        include: [{ model: Product, as: 'products' }]
    });

    if (!category) {
        throw ApiError.notFound('Catégorie non trouvée');
    }

    if (category.products && category.products.length > 0) {
        throw ApiError.badRequest('Impossible de supprimer une catégorie contenant des produits');
    }

    await category.destroy();

    logger.info(`Category deleted: ${category.nom} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Catégorie supprimée avec succès');
});

// ============================================
// PRODUCT CONTROLLERS
// ============================================

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Admin, Assistant
 */
const createProduct = asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);

    logger.info(`Product created: ${product.nom} by ${req.user.email}`);

    ApiResponse.created(res, { product }, 'Produit créé avec succès');
});

/**
 * @desc    Get all products with filters
 * @route   GET /api/products
 * @access  Admin, Assistant
 */
const getProducts = asyncHandler(async (req, res) => {
    const { page, limit, category, statut, search } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const where = { is_active: true };

    if (category) where.category_id = category;
    if (statut) where.statut = statut;
    if (search) {
        where[Op.or] = [
            { nom: { [Op.iLike]: `%${search}%` } },
            { code_produit: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } }
        ];
    }

    const data = await Product.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'nom']
        }],
        order: [['nom', 'ASC']]
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, items, pagination);
});

/**
 * @desc    Get product by ID with movement history
 * @route   GET /api/products/:id
 * @access  Admin, Assistant
 */
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id, {
        include: [
            { model: Category, as: 'category', attributes: ['id', 'nom'] },
            {
                model: StockMovement,
                as: 'movements',
                limit: 20,
                order: [['createdAt', 'DESC']],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'nom', 'prenom']
                }]
            }
        ]
    });

    if (!product) {
        throw ApiError.notFound('Produit non trouvé');
    }

    ApiResponse.success(res, { product });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Admin, Assistant
 */
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        throw ApiError.notFound('Produit non trouvé');
    }

    // Don't allow direct quantity update, use stock movements
    const { quantite_actuelle, ...updateData } = req.body;

    await product.update(updateData);

    ApiResponse.success(res, { product }, 'Produit mis à jour avec succès');
});

/**
 * @desc    Soft delete product
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        throw ApiError.notFound('Produit non trouvé');
    }

    await product.destroy();

    logger.info(`Product deleted: ${product.nom} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Produit supprimé avec succès');
});

/**
 * @desc    Get product statistics
 * @route   GET /api/products/stats
 * @access  Admin, Assistant
 */
const getProductStats = asyncHandler(async (req, res) => {
    const [total, ok, alerte, rupture] = await Promise.all([
        Product.count({ where: { is_active: true } }),
        Product.count({ where: { is_active: true, statut: 'OK' } }),
        Product.count({ where: { is_active: true, statut: 'ALERTE' } }),
        Product.count({ where: { is_active: true, statut: 'RUPTURE' } })
    ]);

    // Products by category
    const byCategory = await Product.findAll({
        attributes: [
            'category_id',
            [sequelize.fn('COUNT', sequelize.col('Product.id')), 'count']
        ],
        where: { is_active: true },
        include: [{
            model: Category,
            as: 'category',
            attributes: ['nom']
        }],
        group: ['category_id', 'category.id'],
        raw: true,
        nest: true
    });

    ApiResponse.success(res, {
        stats: {
            total,
            ok,
            alerte,
            rupture,
            byCategory
        }
    });
});

// ============================================
// STOCK MOVEMENT CONTROLLERS
// ============================================

/**
 * @desc    Record stock entry
 * @route   POST /api/stock/entry
 * @access  Admin, Assistant
 */
const recordStockEntry = asyncHandler(async (req, res) => {
    const { product_id, quantite, source, reference, notes } = req.body;

    // Use a transaction and row-level lock to prevent concurrent updates
    const result = await sequelize.transaction(async (t) => {
        const product = await Product.findByPk(product_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!product) {
            throw ApiError.notFound('Produit non trouvé');
        }

        const quantite_avant = parseFloat(product.quantite_actuelle);
        const quantite_ajoutee = parseFloat(quantite);
        const quantite_apres = quantite_avant + quantite_ajoutee;

        // Create movement record within transaction
        const movement = await StockMovement.create({
            product_id,
            type: 'ENTREE',
            quantite: quantite_ajoutee,
            quantite_avant,
            quantite_apres,
            source,
            reference,
            notes,
            user_id: req.user.id
        }, { transaction: t });

        // Update product quantity
        product.quantite_actuelle = quantite_apres;
        await product.save({ transaction: t });

        // Create notification outside of transaction is acceptable, but keep context
        await notificationService.createStockMovementNotification(movement, product, req.user);

        logger.info(`Stock entry: ${product.nom} +${quantite_ajoutee} by ${req.user.email}`);

        return { movement, product };
    });

    ApiResponse.created(res, result, 'Entrée de stock enregistrée');
});

/**
 * @desc    Record stock exit
 * @route   POST /api/stock/exit
 * @access  Admin, Assistant
 */
const recordStockExit = asyncHandler(async (req, res) => {
    const { product_id, quantite, destination, reference, notes } = req.body;

    // Use a transaction and row-level lock to avoid race conditions
    const result = await sequelize.transaction(async (t) => {
        const product = await Product.findByPk(product_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!product) {
            throw ApiError.notFound('Produit non trouvé');
        }

        const quantite_avant = parseFloat(product.quantite_actuelle);
        const quantite_sortie = parseFloat(quantite);

        if (quantite_sortie > quantite_avant) {
            throw ApiError.badRequest(`Quantité insuffisante. Stock actuel: ${quantite_avant}`);
        }

        const quantite_apres = quantite_avant - quantite_sortie;

        // Create movement record within transaction
        const movement = await StockMovement.create({
            product_id,
            type: 'SORTIE',
            quantite: quantite_sortie,
            quantite_avant,
            quantite_apres,
            destination,
            reference,
            notes,
            user_id: req.user.id
        }, { transaction: t });

        // Update product quantity
        product.quantite_actuelle = quantite_apres;
        await product.save({ transaction: t });

        // Create notifications (outside transaction context is OK)
        await notificationService.createStockMovementNotification(movement, product, req.user);

        // Check for alert threshold after update
        if (product.statut === 'ALERTE' || product.statut === 'RUPTURE') {
            await notificationService.createStockAlertNotification(product);
        }

        logger.info(`Stock exit: ${product.nom} -${quantite_sortie} to ${destination} by ${req.user.email}`);

        return { movement, product };
    });

    ApiResponse.created(res, result, 'Sortie de stock enregistrée');
});

/**
 * @desc    Get stock movements history
 * @route   GET /api/stock/movements
 * @access  Admin, Assistant
 */
const getStockMovements = asyncHandler(async (req, res) => {
    const { page, limit, product, type, startDate, endDate } = req.query;
    const { limit: limitNum, offset, page: pageNum } = getPagination(page, limit);

    const where = {};

    if (product) where.product_id = product;
    if (type) where.type = type;
    if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const data = await StockMovement.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        include: [
            {
                model: Product,
                as: 'product',
                attributes: ['id', 'nom', 'code_produit', 'unite']
            },
            {
                model: User,
                as: 'user',
                attributes: ['id', 'nom', 'prenom']
            }
        ],
        order: [[sequelize.col('StockMovement.created_at'), 'DESC']]
    });

    const { items, pagination } = getPagingData(data, pageNum, limitNum);

    ApiResponse.paginated(res, items, pagination);
});

/**
 * @desc    Get products with alerts
 * @route   GET /api/stock/alerts
 * @access  Admin, Assistant
 */
const getStockAlerts = asyncHandler(async (req, res) => {
    const products = await Product.findAll({
        where: {
            is_active: true,
            statut: { [Op.in]: ['ALERTE', 'RUPTURE'] }
        },
        include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'nom']
        }],
        order: [
            [sequelize.literal("CASE WHEN statut = 'RUPTURE' THEN 1 ELSE 2 END"), 'ASC'],
            ['nom', 'ASC']
        ]
    });

    const rupture = products.filter(p => p.statut === 'RUPTURE');
    const alerte = products.filter(p => p.statut === 'ALERTE');

    ApiResponse.success(res, {
        total: products.length,
        rupture: rupture.length,
        alerte: alerte.length,
        products
    });
});

module.exports = {
    // Categories
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    // Products
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductStats,
    // Stock movements
    recordStockEntry,
    recordStockExit,
    getStockMovements,
    getStockAlerts
};

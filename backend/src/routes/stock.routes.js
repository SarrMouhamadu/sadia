const express = require('express');
const router = express.Router();
const { stockController } = require('../controllers');
const { authMiddleware, staffOnly, adminOnly, validate } = require('../middlewares');
const {
    createCategoryValidator,
    updateCategoryValidator,
    categoryIdValidator,
    createProductValidator,
    updateProductValidator,
    productIdValidator,
    listProductsValidator,
    stockEntryValidator,
    stockExitValidator,
    listMovementsValidator
} = require('../validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - nom
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nom:
 *           type: string
 *         description:
 *           type: string
 *         is_active:
 *           type: boolean
 *     Product:
 *       type: object
 *       required:
 *         - nom
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nom:
 *           type: string
 *         description:
 *           type: string
 *         category_id:
 *           type: string
 *           format: uuid
 *         code_produit:
 *           type: string
 *         unite:
 *           type: string
 *         quantite_actuelle:
 *           type: number
 *         seuil_alerte:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [OK, ALERTE, RUPTURE]
 *     StockMovement:
 *       type: object
 *       required:
 *         - product_id
 *         - type
 *         - quantite
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         product_id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [ENTREE, SORTIE]
 *         quantite:
 *           type: number
 *         destination:
 *           type: string
 *         source:
 *           type: string
 *         notes:
 *           type: string
 */

// ============================================
// CATEGORY ROUTES
// ============================================

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Produits de nettoyage
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/categories', authMiddleware, staffOnly, createCategoryValidator, validate, stockController.createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', authMiddleware, staffOnly, stockController.getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
router.put('/categories/:id', authMiddleware, staffOnly, updateCategoryValidator, validate, stockController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category (Admin only)
 *     tags: [Categories]
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
 *         description: Category deleted
 *       400:
 *         description: Category has products
 *       404:
 *         description: Category not found
 */
router.delete('/categories/:id', authMiddleware, adminOnly, categoryIdValidator, validate, stockController.deleteCategory);

// ============================================
// PRODUCT ROUTES
// ============================================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Savon liquide
 *               description:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               code_produit:
 *                 type: string
 *               unite:
 *                 type: string
 *                 example: litre
 *               quantite_actuelle:
 *                 type: number
 *                 example: 50
 *               seuil_alerte:
 *                 type: number
 *                 example: 10
 *               prix_unitaire:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/products', authMiddleware, staffOnly, createProductValidator, validate, stockController.createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [OK, ALERTE, RUPTURE]
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
 *         description: List of products
 */
router.get('/products', authMiddleware, staffOnly, listProductsValidator, validate, stockController.getProducts);

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics
 */
router.get('/products/stats', authMiddleware, staffOnly, stockController.getProductStats);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID with movement history
 *     tags: [Products]
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
 *         description: Product details with movements
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', authMiddleware, staffOnly, productIdValidator, validate, stockController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put('/products/:id', authMiddleware, staffOnly, updateProductValidator, validate, stockController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (soft delete, Admin only)
 *     tags: [Products]
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
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete('/products/:id', authMiddleware, adminOnly, productIdValidator, validate, stockController.deleteProduct);

// ============================================
// STOCK MOVEMENT ROUTES
// ============================================

/**
 * @swagger
 * /api/stock/entry:
 *   post:
 *     summary: Record stock entry
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantite
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantite:
 *                 type: number
 *                 example: 100
 *               source:
 *                 type: string
 *                 example: Fournisseur ABC
 *               reference:
 *                 type: string
 *                 example: FAC-2024-001
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock entry recorded
 *       404:
 *         description: Product not found
 */
router.post('/stock/entry', authMiddleware, staffOnly, stockEntryValidator, validate, stockController.recordStockEntry);

/**
 * @swagger
 * /api/stock/exit:
 *   post:
 *     summary: Record stock exit
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantite
 *               - destination
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantite:
 *                 type: number
 *                 example: 10
 *               destination:
 *                 type: string
 *                 example: Site A
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock exit recorded
 *       400:
 *         description: Insufficient quantity
 *       404:
 *         description: Product not found
 */
router.post('/stock/exit', authMiddleware, staffOnly, stockExitValidator, validate, stockController.recordStockExit);

/**
 * @swagger
 * /api/stock/movements:
 *   get:
 *     summary: Get stock movements history
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ENTREE, SORTIE]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of movements
 */
router.get('/stock/movements', authMiddleware, staffOnly, listMovementsValidator, validate, stockController.getStockMovements);

/**
 * @swagger
 * /api/stock/alerts:
 *   get:
 *     summary: Get products with stock alerts
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products in alert or rupture state
 */
router.get('/stock/alerts', authMiddleware, staffOnly, stockController.getStockAlerts);

module.exports = router;

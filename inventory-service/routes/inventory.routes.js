const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventory.controller');

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: List of inventory
 *   post:
 *     summary: Create new inventory entry
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               reorder_level:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Inventory created
 */
router.get('/', controller.getAll);
router.post('/', controller.create);

/**
 * @swagger
 * /api/inventory/product/{productId}:
 *   get:
 *     summary: Get inventory for a specific product
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory item
 */
router.get('/product/:productId', controller.getByProductId);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory entry
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               reorder_level:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete inventory entry
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 */
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

/**
 * @swagger
 * /api/inventory/{productId}/check:
 *   get:
 *     summary: Check stock availability
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock availability result
 */
router.get('/:productId/check', controller.checkStock);

/**
 * @swagger
 * /api/inventory/{productId}/logs:
 *   get:
 *     summary: Get inventory logs for a product
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory logs
 */
router.get('/:productId/logs', controller.getLogs);

/**
 * @swagger
 * /api/inventory/restock:
 *   post:
 *     summary: Restock a product
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: integer
 *               product_name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Restocked
 */
router.post('/restock', controller.restock);

/**
 * @swagger
 * /api/inventory/deduct:
 *   post:
 *     summary: Deduct stock (called by order service)
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock deducted
 */
router.post('/deduct', controller.deductStock);

// Internal sync endpoint used by product-service to keep stock consistent
router.post('/sync', controller.syncStock);

module.exports = router;

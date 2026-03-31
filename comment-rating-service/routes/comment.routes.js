const express = require('express');
const router = express.Router();
const controller = require('../controllers/comment.controller');

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: List of all comments
 *   post:
 *     summary: Create a new comment/rating
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, user_id, rating]
 *             properties:
 *               product_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               user_name:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 enum: [1, 2, 3, 4, 5]
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 */
router.get('/', controller.getAll);
router.post('/', controller.create);

/**
 * @swagger
 * /api/comments/product/{productId}:
 *   get:
 *     summary: Get comments and ratings for a product
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comments and rating statistics
 */
router.get('/product/:productId', controller.getByProductId);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comment details
 *   put:
 *     summary: Update comment
 *     tags: [Comments]
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
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete comment
 *     tags: [Comments]
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
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

/**
 * @swagger
 * /api/comments/{id}/helpful:
 *   post:
 *     summary: Mark comment as helpful
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marked as helpful
 */
router.post('/:id/helpful', controller.markHelpful);

module.exports = router;

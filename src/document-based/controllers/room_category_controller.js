import crudService from '../services/room_category_service.js';
import roomCategoryController from '../../controllers/v1/abstract/room_category_controller.js';

const ctrl = roomCategoryController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room_category/{name}':
 *  get:
 *     tags:
 *       - MongoDB Room Category Controller
 *     summary: Get a Room Category
 *     parameters:
 *      - in: path
 *        name: name
 *        required: true
 *     responses:
 *      200:
 *        description: OK
 *        content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/type'
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 *      500:
 *        description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mongodb/room_categories':
 *  get:
 *      tags:
 *       - MongoDB Room Category Controller
 *      summary: Get all Room Categories
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *             type: integer
 *        - in: query
 *          name: limit
 *          schema:
 *             type: integer
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/types'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

export default ctrl.router;

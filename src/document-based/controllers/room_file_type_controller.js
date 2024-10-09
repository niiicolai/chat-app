import crudService from '../services/room_file_type_service.js';
import roomFileTypeController from '../../controllers/v1/abstract/room_file_type_controller.js';

const ctrl = roomFileTypeController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room_file_type/{name}':
 *  get:
 *     tags:
 *       - MongoDB Room File Type Controller
 *     summary: Get a Room File Type
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
 * '/api/v1/mongodb/room_file_types':
 *  get:
 *      tags:
 *       - MongoDB Room File Type Controller
 *      summary: Get all Room File Type
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

import crudService from '../services/channel_type_service.js';
import channelTypeController from '../../shared/controllers/channel_type_controller.js';

const ctrl = channelTypeController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/channel_type/{name}':
 *  get:
 *     tags:
 *       - MongoDB Channel Type Controller
 *     summary: Get a Channel Type
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
 * '/api/v1/mongodb/channel_types':
 *  get:
 *      tags:
 *       - MongoDB Channel Type Controller
 *      summary: Get all Channel Types
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

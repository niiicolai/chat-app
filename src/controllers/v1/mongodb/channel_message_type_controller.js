import crudService from '../../../services/mongodb/channel_message_type_service.js';
import channelMessageTypeController from '../abstract/channel_message_type_controller.js';

const ctrl = channelMessageTypeController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/channel_message_type/{name}':
 *  get:
 *     tags:
 *       - MongoDB Channel Message Type Controller
 *     summary: Get a Channel Message Type
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
 * '/api/v1/mongodb/channel_message_types':
 *  get:
 *      tags:
 *       - MongoDB Channel Message Type Controller
 *      summary: Get all Channel Message Types
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

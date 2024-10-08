import crudService from '../services/channel_message_type_service.js';
import channelMessageTypeController from '../../shared/controllers/channel_message_type_controller.js';

const ctrl = channelMessageTypeController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/channel_message_type/{name}':
 *  get:
 *     tags:
 *       - Neo4j Channel Message Type Controller
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
 * '/api/v1/neo4j/channel_message_types':
 *  get:
 *      tags:
 *       - Neo4j Channel Message Type Controller
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

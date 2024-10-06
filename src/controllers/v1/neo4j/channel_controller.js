import crudService from '../../../services/neo4j/channel_service.js';
import channelController from '../abstract/channel_controller.js';

const ctrl = channelController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/channel/{uuid}':
 *  get:
 *    tags:
 *     - Neo4j Channel Controller
 *    summary: Get channel by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          user:
 *           $ref: '#/components/schemas/channel'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/neo4j/channels':
 *  get:
 *      tags:
 *       - Neo4j Channel Controller
 *      summary: Get all Channels for a Room
 *      security:
 *       - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *             type: integer
 *        - in: query
 *          name: limit
 *          schema:
 *             type: integer
 *        - in: query
 *          name: room_uuid
 *          required: true
 *          schema:
 *             type: string
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/channels'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 *  '/api/v1/neo4j/channel':
 *   post:
 *    tags:
 *     - Neo4j Channel Controller
 *    summary: Create a Channel
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/channelInput'
 *     responses:
 *      200:
 *       description: OK
 *       content:
 *        application/json:
 *         schema:
 *          $ref: '#/components/schemas/channel'
 *      400:
 *       description: Bad Request
 *      500:
 *       description: Internal Server Error
 */
ctrl.create();

/**
 * @openapi
 *  '/api/v1/neo4j/channel/{uuid}':
 *   patch:
 *    tags:
 *     - Neo4j Channel Controller
 *    summary: Update a Channel
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/channelUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/channel'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();

/**
 * @openapi
 *  '/api/v1/neo4j/channel/{uuid}':
 *   delete:
 *    tags:
 *     - Neo4j Channel Controller
 *    summary: Delete a Channel
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *    responses:
 *     204:
 *      description: No Content
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.destroy();

export default ctrl.router;

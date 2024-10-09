import crudService from '../services/channel_message_service.js';
import channelMessageController from '../../shared/controllers/channel_message_controller.js';

const ctrl = channelMessageController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/channel_message/{uuid}':
 *  get:
 *    tags:
 *     - MySQL Channel Message Controller
 *    summary: Get channel message by UUID
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
 *           $ref: '#/components/schemas/channelMessage'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mysql/channel_messages':
 *  get:
 *      tags:
 *       - MySQL Channel Message Controller
 *      summary: Get all Channel Messages for a Channel
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
 *          name: channel_uuid
 *          required: true
 *          schema:
 *             type: string
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/channelMessages'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 *  '/api/v1/mysql/channel_message':
 *   post:
 *    tags:
 *     - MySQL Channel Message Controller
 *    summary: Create a Channel Message
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/channelMessageInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/channelMessage'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.create();

/**
 * @openapi
 *  '/api/v1/mysql/channel_message/{uuid}':
 *   patch:
 *    tags:
 *     - MySQL Channel Message Controller
 *    summary: Update a Channel Message
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/channelMessageUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/channelMessage'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();

/**
 * @openapi
 *  '/api/v1/mysql/channel_message/{uuid}':
 *   delete:
 *    tags:
 *     - MySQL Channel Message Controller
 *    summary: Delete a Channel Message
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *    responses:
 *     204:
 *      description: No Content
 *     500:
 *      description: Internal Server Error
 */
ctrl.destroy();

export default ctrl.router;

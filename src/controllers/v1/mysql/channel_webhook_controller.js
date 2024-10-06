import crudService from '../../../services/mysql/channel_webhook_service.js';
import channelWebhookController from '../abstract/channel_webhook_controller.js';

const ctrl = channelWebhookController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/channel_webhook/{uuid}':
 *  get:
 *    tags:
 *     - MySQL Channel Webhook Controller
 *    summary: Get channel webhook by UUID
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
 *           $ref: '#/components/schemas/channelWebhook'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mysql/channel_webhooks':
 *  get:
 *      tags:
 *       - MySQL Channel Webhook Controller
 *      summary: Get all Channel Webhooks for a Room
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
 *                          $ref: '#/components/schemas/channelWebhooks'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 *  '/api/v1/mysql/channel_webhook/{uuid}':
 *   post:
 *    tags:
 *     - MySQL Channel Webhook Controller
 *    summary: Send a message to a channel webhook
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/channelWebhookMessageInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/channelWebhookMessage'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.message();

/**
 * @openapi
 *  '/api/v1/mysql/channel_webhook':
 *   post:
 *    tags:
 *     - MySQL Channel Webhook Controller
 *    summary: Create a Channel Webhook
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/channelWebhookInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/channelWebhook'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.create();

/**
 * @openapi
 *  '/api/v1/mysql/channel_webhook/{uuid}':
 *   patch:
 *    tags:
 *     - MySQL Channel Webhook Controller
 *    summary: Update a Channel Webhook
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
 *        $ref: '#/components/schemas/channelWebhookUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/channelWebhook'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();

/**
 * @openapi
 *  '/api/v1/mysql/channel_webhook/{uuid}':
 *   delete:
 *    tags:
 *     - MySQL Channel Webhook Controller
 *    summary: Delete a Channel Webhook
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

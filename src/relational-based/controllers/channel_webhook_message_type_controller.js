import crudService from '../services/channel_webhook_message_type_service.js';
import channelWebhookMessageTypeController from '../../shared/controllers/channel_webhook_message_type_controller.js';

const ctrl = channelWebhookMessageTypeController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/channel_webhook_message_type/{name}':
 *  get:
 *     tags:
 *       - MySQL Channel Webhook Message Type Controller
 *     summary: Get a Channel Webhook Message Type
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
 * '/api/v1/mysql/channel_webhook_message_types':
 *  get:
 *      tags:
 *       - MySQL Channel Webhook Message Type Controller
 *      summary: Get all Channel Webhook Message Types
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

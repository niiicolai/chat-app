import crudService from '../services/channel_message_upload_type_service.js';
import channelMessageUploadTypeController from '../../shared/controllers/channel_message_upload_type_controller.js';

const ctrl = channelMessageUploadTypeController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/channel_message_upload_type/{name}':
 *  get:
 *     tags:
 *       - MongoDB Channel Message Upload Type Controller
 *     summary: Get a Channel Upload Message Type
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
 * '/api/v1/mongodb/channel_message_upload_types':
 *  get:
 *      tags:
 *       - MongoDB Channel Message Upload Type Controller
 *      summary: Get all Channel Message Upload Types
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

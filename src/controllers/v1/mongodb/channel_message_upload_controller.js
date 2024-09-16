import crudService from '../../../services/mysql/channel_message_upload_service.js';
import channelMessageUploadController from '../abstract/channel_message_upload_controller.js';

const ctrl = channelMessageUploadController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/channel_message_upload/:channel_message_upload_uuid':
 *  get:
 *    tags:
 *     - MongoDB Channel Message Upload Controller
 *    summary: Get channel message upload by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: channel_message_upload_uuid
 *       required: true
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *           $ref: '#/components/schemas/channelMessageUpload'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mongodb/channel_message_uploads':
 *  get:
 *      tags:
 *       - MongoDB Channel Message Upload Controller
 *      summary: Get all Channel Message Uploads for a Channel Message
 *      security:
 *       - bearerAuth: []
 *      parameters:
 *       - in: query
 *         name: page
 *         schema:
 *            type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *            type: integer
 *       - in: query
 *         name: channel_message_uuid
 *         required: true
 *         schema:
 *            type: string
 *      responses:
 *          200:
 *            description: OK
 *            content:
 *             application/json:
 *              schema:
 *               $ref: '#/components/schemas/channelMessageUploads'
 *          400:
 *           description: Bad Request
 *          500:
 *           description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 *  '/api/v1/mongodb/channel_message_upload/{channel_message_upload_uuid}':
 *   delete:
 *    tags:
 *     - MongoDB Channel Message Upload Controller
 *    summary: Delete a channel message upload
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: channel_message_upload_uuid
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

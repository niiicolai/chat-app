import crudService from '../../../services/mysql/room_file_service.js';
import roomFileController from '../abstract/room_file_controller.js';

const ctrl = roomFileController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room_file/:room_file_uuid':
 *  get:
 *    tags:
 *     - MongoDB Room File Controller
 *    summary: Get room file by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: room_file_uuid
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
 *           $ref: '#/components/schemas/roomFile'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mongodb/room_files':
 *  get:
 *      tags:
 *       - MongoDB Room File Controller
 *      summary: Get all Room Files for a Room
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
 *                          $ref: '#/components/schemas/roomFiles'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 * '/api/v1/mongodb/room_file':
 *  delete:
 *      tags:
 *       - MongoDB Room File Controller
 *      summary: Delete a Room File
 *      security:
 *       - bearerAuth: []
 *      parameters:
 *       - in: path
 *         name: room_file_uuid
 *         required: true
 *      responses:
 *          204:
 *              description: No Content
 *          500:
 *              description: Internal Server Error
 */
ctrl.destroy();

export default ctrl.router;

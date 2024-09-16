import crudService from '../../../services/mysql/room_user_service.js';
import roomUserController from '../abstract/room_user_controller.js';

const ctrl = roomUserController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room_user/:room_user_uuid':
 *  get:
 *    tags:
 *     - MongoDB Room User Controller
 *    summary: Get room user by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: room_user_uuid
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
 *           $ref: '#/components/schemas/roomUser'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mongodb/room_users':
 *  get:
 *    tags:
 *     - MongoDB Room User Controller
 *    summary: Get room users for a room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: page
 *       schema:
 *        type: integer
 *     - in: query
 *       name: limit
 *       schema:
 *        type: integer
 *     - in: query
 *       name: room_uuid
 *       required: true
 *       schema:
 *        type: string
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/roomUsers'
 *            
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findAll();

export default ctrl.router;

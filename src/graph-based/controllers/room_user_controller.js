import crudService from '../services/room_user_service.js';
import roomUserController from '../../shared/controllers/room_user_controller.js';

const ctrl = roomUserController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/room_user/{uuid}':
 *  get:
 *    tags:
 *     - Neo4j Room User Controller
 *    summary: Get room user by UUID
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
 *           $ref: '#/components/schemas/roomUser'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/neo4j/room_users':
 *  get:
 *    tags:
 *     - Neo4j Room User Controller
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

/**
 * @openapi
 * '/api/v1/neo4j/room_user/{uuid}':
 *  patch:
 *   tags:
 *    - Neo4j Room User Controller
 *   summary: Update room user
 *   security:
 *    - bearerAuth: []
 *   parameters:
 *    - in: path
 *      name: uuid
 *      required: true
 *      schema:
 *       type: string
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        role_name:
 *         type: string
 *         enum: [Admin, Moderator, Member]
 *  responses:
 *   204:
 *    description: No Content
 *   400:
 *    description: Bad Request
 *   500:
 *    description: Internal Server Error
 */
ctrl.update();

/**
 * @openapi
 *  '/api/v1/neo4j/room_user/{uuid}':
 *   delete:
 *    tags:
 *     - Neo4j Room User Controller
 *    summary: Delete room user
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: uuid
 *       required: true
 *       schema:
 *        type: string
 *    responses:
 *     204:
 *      description: No Content
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.destroy();

/**
 * @openapi
 *  '/api/v1/neo4j/room_user/me/{room_uuid}':
 *   get:
 *    tags:
 *     - Neo4j Room User Controller
 *    summary: Get authenticated user in a room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
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
 *         $ref: '#/components/schemas/roomUser'
 *     400:
 *      description: Bad Request
 *     500:
 *     description: Internal Server Error
 */
ctrl.findAuthenticatedUser();

export default ctrl.router;

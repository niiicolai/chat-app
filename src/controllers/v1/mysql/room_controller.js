import crudService from '../../../services/mysql/room_service.js';
import roomController from '../abstract/room_controller.js';

const ctrl = roomController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/room/:room_uuid':
 *  get:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Get Room by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: room_uuid
 *        required: true
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          room:
 *           $ref: '#/components/schemas/room'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();


/**
 * @openapi
 * '/api/v1/mysql/rooms':
 *  get:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Get Rooms
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
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         $ref: '#/components/schemas/rooms'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 * '/api/v1/mysql/room':
 *  post:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Create a Room
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/roomInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          room:
 *           $ref: '#/components/schemas/room'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.create();


/**
 * @openapi
 * '/api/v1/mysql/room/:room_uuid':
 *  patch:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Update a Room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: room_uuid
 *        required: true
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/roomUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          room:
 *           $ref: '#/components/schemas/room'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();

/**
 * @openapi
 * '/api/v1/mysql/room/:room_uuid/join_settings':
 *  patch:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Update a Room's Join Settings
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: room_uuid
 *        required: true
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/roomJoinSettingsInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          room:
 *           $ref: '#/components/schemas/room'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.editJoinSettings();

/**
 * @openapi
 * '/api/v1/mysql/room/:room_uuid/leave':
 *  delete:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Leave a Room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: room_uuid
 *        required: true
 *    responses:
 *     204:
 *      description: No Content
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.leave();

/**
 * @openapi
 * '/api/v1/mysql/room/:room_uuid':
 *  delete:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Destroy a Room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: room_uuid
 *        required: true
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
 * '/api/v1/mysql/room/:room_uuid/avatar':
 *  delete:
 *    tags:
 *     - MySQL Room Controller
 *    summary: Destroy a Room's Avatar
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: room_uuid
 *        required: true
 *    responses:
 *     204:
 *      description: No Content
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.destroyAvatar();


export default ctrl.router; 

import crudService from '../services/room_service.js';
import roomController from '../../shared/controllers/room_controller.js';

const ctrl = roomController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room/{uuid}':
 *  get:
 *    tags:
 *     - MongoDB Room Controller
 *    summary: Get Room by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: uuid
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
 * '/api/v1/mongodb/rooms':
 *  get:
 *    tags:
 *     - MongoDB Room Controller
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
 * '/api/v1/mongodb/room':
 *  post:
 *    tags:
 *     - MongoDB Room Controller
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
 * '/api/v1/mongodb/room/{uuid}':
 *  patch:
 *    tags:
 *     - MongoDB Room Controller
 *    summary: Update a Room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: uuid
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
 * '/api/v1/mongodb/room/{uuid}/settings':
 *  patch:
 *    tags:
 *     - MongoDB Room Controller
 *    summary: Update a Room's Settings
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: uuid
 *        required: true
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/roomSettingsInput'
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
ctrl.editSettings();

/**
 * @openapi
 * '/api/v1/mongodb/room/{uuid}/leave':
 *  delete:
 *    tags:
 *     - MongoDB Room Controller
 *    summary: Leave a Room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: uuid
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



export default ctrl.router; 

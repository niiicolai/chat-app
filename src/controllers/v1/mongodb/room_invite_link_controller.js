import crudService from '../../../services/mysql/room_invite_link_service.js';
import roomInviteLinkController from '../abstract/room_invite_link_controller.js';

const ctrl = roomInviteLinkController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room_invite_link/{uuid}':
 *  get:
 *    tags:
 *     - MongoDB Room Invite Link Controller
 *    summary: Get a Room Invite Link by UUID
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
 *           $ref: '#/components/schemas/roomInviteLink'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mongodb/room_invite_links':
 *  get:
 *    tags:
 *     - MongoDB Room Invite Link Controller
 *    summary: Get all Room Invite Links for a Room
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: query
 *       name: room_uuid
 *       schema:
 *        type: string
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
 *         $ref: '#/components/schemas/roomInviteLinks'
 *            
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findAll();

/**
 * @openapi
 * '/api/v1/mongodb/room_invite_link/{uuid}/join':
 *  post:
 *    tags:
 *     - MongoDB Room Invite Link Controller
 *    summary: Join a Room by Room Invite Link UUID
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
ctrl.join();

/**
 * @openapi
 * '/api/v1/mongodb/room_invite_link':
 *  post:
 *    tags:
 *     - MongoDB Room Invite Link Controller
 *    summary: Create a Room Invite Link
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/roomInviteLinkInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          roomInviteLink:
 *           $ref: '#/components/schemas/roomInviteLink'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.create();

/**
 * @openapi
 * '/api/v1/mongodb/room_invite_link/{uuid}':
 *  patch:
 *    tags:
 *     - MongoDB Room Invite Link Controller
 *    summary: Update a Room Invite Link
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: uuid
 *        required: true
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/roomInviteLinkUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          roomInviteLink:
 *           $ref: '#/components/schemas/roomInviteLink'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();

/**
 * @openapi
 * '/api/v1/mongodb/room_invite_link/{uuid}':
 *  delete:
 *    tags:
 *     - MongoDB Room Invite Link Controller
 *    summary: Destroy a Room Invite Link
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
ctrl.destroy();

export default ctrl.router;

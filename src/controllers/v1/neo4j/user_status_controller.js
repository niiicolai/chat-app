import crudService from '../../../services/neo4j/user_status_service.js';
import userStatusController from '../abstract/user_status_controller.js';

const ctrl = userStatusController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/user_status/me':
 *  get:
 *    tags:
 *     - Neo4j User Status Controller
 *    summary: Find the authenticated user's status
 *    security:
 *     - bearerAuth: []
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          userStatus:
 *           $ref: '#/components/schemas/userStatus'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/neo4j/user_status/me':
 *  patch:
 *    tags:
 *     - Neo4j User Status Controller
 *    summary: Update the authenticated user's status
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/userStatusUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *           userStatus:
 *            $ref: '#/components/schemas/userStatus'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();

export default ctrl.router;
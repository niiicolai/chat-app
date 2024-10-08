import crudService from '../services/user_status_service.js';
import userStatusController from '../../shared/controllers/user_status_controller.js';

const ctrl = userStatusController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/user_status/me':
 *  get:
 *    tags:
 *     - MySQL User Status Controller
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
 * '/api/v1/mysql/user_status/me':
 *  patch:
 *    tags:
 *     - MySQL User Status Controller
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
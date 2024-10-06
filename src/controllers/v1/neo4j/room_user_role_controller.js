import crudService from '../../../services/neo4j/room_user_role_service.js';
import roomUserRoleController from '../abstract/room_user_role_controller.js';

const ctrl = roomUserRoleController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/room_user_role/{name}':
 *  get:
 *     tags:
 *       - Neo4j Room User Role Controller
 *     summary: Get a Room User Role
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
 * '/api/v1/neo4j/room_user_roles':
 *  get:
 *      tags:
 *       - Neo4j Room User Role Controller
 *      summary: Get all Room User Roles
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

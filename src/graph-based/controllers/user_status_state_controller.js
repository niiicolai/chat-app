import crudService from '../services/user_status_state_service.js';
import userStatusStateController from '../../shared/controllers/user_status_state_controller.js';

const ctrl = userStatusStateController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/user_status_state/{name}':
 *  get:
 *     tags:
 *       - Neo4j User Status State Controller
 *     summary: Get a User Status State
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
 * '/api/v1/neo4j/user_status_states':
 *  get:
 *      tags:
 *       - Neo4j User Status State Controller
 *      summary: Get all User Status States 
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

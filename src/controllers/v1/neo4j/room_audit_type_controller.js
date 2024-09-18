import crudService from '../../../services/mysql/room_audit_type_service.js';
import roomAuditTypeController from '../abstract/room_audit_type_controller.js';

const ctrl = roomAuditTypeController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/room_audit_type/:name':
 *  get:
 *     tags:
 *       - Neo4j Room Audit Type Controller
 *     summary: Get a Room Audit Type
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
 * '/api/v1/neo4j/room_audit_types':
 *  get:
 *      tags:
 *       - Neo4j Room Audit Type Controller
 *      summary: Get all Room Audit Types
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

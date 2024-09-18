import crudService from '../../../services/mysql/room_audit_service.js';
import roomAuditController from '../abstract/room_audit_controller.js';

const ctrl = roomAuditController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/room_audit/:room_audit_uuid':
 *  get:
 *    tags:
 *     - Neo4j Room Audit Controller
 *    summary: Get room audit by UUID
 *    security:
 *     - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: room_audit_uuid
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
 *           $ref: '#/components/schemas/roomAudit'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/neo4j/room_audits':
 *  get:
 *      tags:
 *       - Neo4j Room Audit Controller
 *      summary: Get all Room Audits for a Room
 *      security:
 *       - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *             type: integer
 *        - in: query
 *          name: limit
 *          schema:
 *             type: integer
 *        - in: query
 *          name: room_uuid
 *          required: true
 *          schema:
 *             type: string
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/roomAudits'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

export default ctrl.router;

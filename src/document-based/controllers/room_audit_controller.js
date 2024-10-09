import crudService from '../services/room_audit_service.js';
import roomAuditController from '../../shared/controllers/room_audit_controller.js';

const ctrl = roomAuditController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/room_audit/{uuid}':
 *  get:
 *    tags:
 *     - MongoDB Room Audit Controller
 *    summary: Get room audit by UUID
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
 *           $ref: '#/components/schemas/roomAudit'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/mongodb/room_audits':
 *  get:
 *      tags:
 *       - MongoDB Room Audit Controller
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
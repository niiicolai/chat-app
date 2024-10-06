import crudService from '../../../services/neo4j/channel_audit_service.js';
import channelAuditController from '../abstract/channel_audit_controller.js';

const ctrl = channelAuditController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/channel_audit/{uuid}':
 *  get:
 *    tags:
 *     - Neo4j Channel Audit Controller
 *    summary: Get channel audit by UUID
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
 *           $ref: '#/components/schemas/channelAudit'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/neo4j/channel_audits':
 *  get:
 *      tags:
 *       - Neo4j Channel Audit Controller
 *      summary: Get all Channel Audits for a Room
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
 *          name: channel_uuid
 *          required: true
 *          schema:
 *             type: string
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/channelAudits'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

export default ctrl.router;

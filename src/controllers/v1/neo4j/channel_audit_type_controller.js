import crudService from '../../../services/neo4j/channel_audit_type_service.js';
import channelAuditTypeController from '../abstract/channel_audit_type_controller.js';

const ctrl = channelAuditTypeController(crudService);

/**
 * @openapi
 * '/api/v1/neo4j/channel_audit_type/{name}':
 *  get:
 *     tags:
 *       - Neo4j Channel Audit Type Controller
 *     summary: Get a Channel Audit Type
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
 * '/api/v1/neo4j/channel_audit_types':
 *  get:
 *      tags:
 *       - Neo4j Channel Audit Type Controller
 *      summary: Get all Channel Audit Types
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
 *                       $ref: '#/components/schemas/types'
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.findAll();

export default ctrl.router;

import crudService from '../../../services/neo4j/user_service.js';
import userController from '../abstract/user_controller.js';

const ctrl = userController(crudService);


/**
 * @openapi
 * '/api/v1/neo4j/user/me':
 *  get:
 *    tags:
 *     - Neo4j User Controller
 *    summary: Get authorized User
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
 *          user:
 *           $ref: '#/components/schemas/user'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.findOne();

/**
 * @openapi
 * '/api/v1/neo4j/user':
 *  post:
 *    tags:
 *     - Neo4j User Controller
 *    summary: Create a User
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *         $ref: '#/components/schemas/userInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          token:
 *           type: string
 *          user:
 *           $ref: '#/components/schemas/user'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.create();

/**
 * @openapi
 * '/api/v1/neo4j/user/login':
 *  post:
 *    tags:
 *     - Neo4j User Controller
 *    summary: Login a User
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/userLoginInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          token:
 *           type: string
 *          user:
 *           $ref: '#/components/schemas/user'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.login();

/**
 * @openapi
 * '/api/v1/neo4j/user/me':
 *  patch:
 *    tags:
 *     - Neo4j User Controller
 *    summary: Update authorized User
 *    security:
 *     - bearerAuth: []
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        $ref: '#/components/schemas/userUpdateInput'
 *    responses:
 *     200:
 *      description: OK
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          user:
 *           $ref: '#/components/schemas/user'
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.update();


/**
 * @openapi
 * '/api/v1/neo4j/user/me':
 *  delete:
 *    tags:
 *     - Neo4j User Controller
 *    summary: Delete authorized User
 *    security:
 *     - bearerAuth: []
 *    responses:
 *     204:
 *      description: No Content
 *     500:
 *      description: Internal Server Error
 */
ctrl.destroy();


/**
 * @openapi
 *  '/api/v1/neo4j/user/me/avatar':
 *   delete:
 *    tags:
 *     - Neo4j User Controller
 *    summary: Remove authorized User's Avatar
 *    security:
 *     - bearerAuth: []
 *    responses:
 *     204:
 *      description: No Content
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.destroyAvatar();

export default ctrl.router;

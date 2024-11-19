import crudService from '../services/google_auth_service.js';
import googleAuthController from '../../shared/controllers/google_auth_controller.js';

const ctrl = googleAuthController(
    crudService, 
    process.env.GOOGLE_NEO4J_SIGNUP_REDIRECT_URL,
    process.env.GOOGLE_NEO4J_LOGIN_REDIRECT_URL,
    process.env.GOOGLE_NEO4J_ADD_REDIRECT_URL
);

/**
 * @openapi
 * '/api/v1/neo4j/user/signup/google':
 *  get:
 *    tags:
 *     - Neo4j Google Auth Controller
 *    summary: Initiate Google OAuth2 sign up
 *    responses:
 *     200:
 *       description: OK
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.signup();

/**
 * @openapi
 * '/api/v1/neo4j/user/signup/google/callback':
 *  get:
 *      tags:
 *       - Neo4j Google Auth Controller
 *      summary: Google OAuth2 sign up callback
 *      parameters:
 *        - in: query
 *          name: code
 *          schema:
 *             type: string
 *      responses:
 *          200:
 *              description: OK
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.signupCallback();

/**
 * @openapi
 * '/api/v1/neo4j/user/login/google':
 *  get:
 *    tags:
 *     - Neo4j Google Auth Controller
 *    summary: Initiate Google OAuth2 login
 *    responses:
 *     200:
 *       description: OK
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.login();

/**
 * @openapi
 * '/api/v1/neo4j/user/login/google/callback':
 *  get:
 *      tags:
 *       - Neo4j Google Auth Controller
 *      summary: Google OAuth2 login callback
 *      parameters:
 *        - in: query
 *          name: code
 *          schema:
 *             type: string
 *      responses:
 *          200:
 *              description: OK
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.loginCallback();

/**
 * @openapi
 * '/api/v1/neo4j/user/add/google':
 *  get:
 *    tags:
 *     - Neo4j Google Auth Controller
 *    summary: Initiate Google OAuth2 add to existing user
 *    responses:
 *     200:
 *       description: OK
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.addToExistingUser();

/**
 * @openapi
 * '/api/v1/neo4j/user/add/google/callback':
 *  get:
 *      tags:
 *       - Neo4j Google Auth Controller
 *      summary: Google OAuth2 add to existing user callback
 *      parameters:
 *        - in: query
 *          name: code
 *          schema:
 *             type: string
 *      responses:
 *          302:
 *             description: Redirect
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.addToExistingUserCallback();

/**
 * @openapi
 * '/api/v1/neo4j/user/add/google/confirm':
 *  post:
 *      tags:
 *       - Neo4j Google Auth Controller
 *      summary: Google OAuth2 add to existing user confirm
 *      security:
 *       - bearerAuth: []
 *      requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          $ref: '#/components/schemas/googleConfirmInput'
 *      responses:
 *          204:
 *              description: OK
 *          400:
 *              description: Bad Request
 *          500:
 *              description: Internal Server Error
 */
ctrl.addToExistingUserConfirm();

export default ctrl.router;

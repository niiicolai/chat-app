import crudService from '../services/google_auth_service.js';
import googleAuthController from '../../shared/controllers/google_auth_controller.js';

const ctrl = googleAuthController(
    crudService, 
    process.env.GOOGLE_MYSQL_SIGNUP_REDIRECT_URL,
    process.env.GOOGLE_MYSQL_LOGIN_REDIRECT_URL,
    process.env.GOOGLE_MYSQL_ADD_REDIRECT_URL
);

/**
 * @openapi
 * '/api/v1/mysql/user/signup/google':
 *  get:
 *    tags:
 *     - MySQL Google Auth Controller
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
 * '/api/v1/mysql/user/signup/google/callback':
 *  get:
 *      tags:
 *       - MySQL Google Auth Controller
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
 * '/api/v1/mysql/user/login/google':
 *  get:
 *    tags:
 *     - MySQL Google Auth Controller
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
 * '/api/v1/mysql/user/login/google/callback':
 *  get:
 *      tags:
 *       - MySQL Google Auth Controller
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
 * '/api/v1/mysql/user/add/google':
 *  get:
 *    tags:
 *     - MySQL Google Auth Controller
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
 * '/api/v1/mysql/user/add/google/callback':
 *  get:
 *      tags:
 *       - MySQL Google Auth Controller
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
 * '/api/v1/mysql/user/add/google/confirm':
 *  post:
 *      tags:
 *       - MySQL Google Auth Controller
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

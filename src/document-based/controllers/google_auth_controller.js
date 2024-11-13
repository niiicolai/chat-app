import crudService from '../services/google_auth_service.js';
import googleAuthController from '../../shared/controllers/google_auth_controller.js';

const ctrl = googleAuthController(
    crudService, 
    process.env.GOOGLE_MONGODB_SIGNUP_REDIRECT_URL,
    process.env.GOOGLE_MONGODB_LOGIN_REDIRECT_URL
);

/**
 * @openapi
 * '/api/v1/mongodb/user/signup/google':
 *  get:
 *    tags:
 *     - MongoDB Google Auth Controller
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
 * '/api/v1/mongodb/user/signup/google/callback':
 *  get:
 *      tags:
 *       - MongoDB Google Auth Controller
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
 * '/api/v1/mongodb/user/login/google':
 *  get:
 *    tags:
 *     - MongoDB Google Auth Controller
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
 * '/api/v1/mongodb/user/login/google/callback':
 *  get:
 *      tags:
 *       - MongoDB Google Auth Controller
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

export default ctrl.router;

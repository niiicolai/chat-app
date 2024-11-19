import crudService from '../services/user_service.js';
import userController from '../../shared/controllers/user_controller.js';

const ctrl = userController(crudService);


/**
 * @openapi
 * '/api/v1/mysql/user/me/logins':
 *  get:
 *   tags:
 *    - MySQL User Controller
 *   summary: Get authorized User's Logins
 *   security:
 *    - bearerAuth: []
 *   responses:
 *    200:
 *     description: OK
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         logins:
 *          type: array
 *          items:
 *           $ref: '#/components/schemas/userLogin'
 *    400:
 *     description: Bad Request
 *    500:
 *     description: Internal Server Error
 */
ctrl.getUserLogins();


/**
 * @openapi
 * '/api/v1/mongodb/user/me':
 *  get:
 *    tags:
 *     - MongoDB User Controller
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
 * '/api/v1/mongodb/user':
 *  post:
 *    tags:
 *     - MongoDB User Controller
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
 * '/api/v1/mongodb/user/login':
 *  post:
 *    tags:
 *     - MongoDB User Controller
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
 * '/api/v1/mongodb/user/me':
 *  patch:
 *    tags:
 *     - MongoDB User Controller
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
 * '/api/v1/mongodb/user/me':
 *  delete:
 *    tags:
 *     - MongoDB User Controller
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
 *  '/api/v1/mongodb/user/me/avatar':
 *   delete:
 *    tags:
 *     - MongoDB User Controller
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


/**
 * @openapi
 * '/api/v1/mongodb/user/me/login/{uuid}':
 *  delete:
 *   tags:
 *    - MongoDB User Controller
 *   summary: Delete authorized User's Login
 *   security:
 *    - bearerAuth: []
 *   parameters:
 *    - in: path
 *      name: uuid
 *      required: true
 *      schema:
 *       type: string
 *   responses:
 *    204:
 *     description: No Content
 *    500:
 *     description: Internal Server Error
 */
ctrl.destroyUserLogins();

export default ctrl.router;

import crudService from '../../../services/mysql/user_password_reset_service.js';
import userPasswordResetController from '../abstract/user_password_reset_controller.js';

const ctrl = userPasswordResetController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/user_password_reset':
 *  post:
 *    tags:
 *     - MySQL User Password Reset Controller
 *    summary: Create User Password Reset
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
ctrl.create();

/**
 * @openapi
 * '/api/v1/mysql/user_password_reset/{uuid}/reset_password':
 *  patch:
 *    tags:
 *     - MySQL User Password Reset Controller
 *    summary: Reset Password by Password Reset UUID (send by email)
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
ctrl.resetPassword();

import crudService from '../../../services/mysql/user_email_verification_service.js';
import userEmailVerificationController from '../abstract/user_email_verification_controller.js';

const ctrl = userEmailVerificationController(crudService);

/**
 * @openapi
 * '/api/v1/mysql/user_email_verification/me/resend':
 *  post:
 *    tags:
 *     - MySQL User Email Verification Controller
 *    summary: Resend email verification
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
ctrl.resend();

/**
 * @openapi
 * '/api/v1/mysql/user_email_verification/{uuid}/confirm':
 *  get:
 *    tags:
 *     - MySQL User Email Verification Controller
 *    summary: Confirm email verification by user email verification UUID (send by email)
 *    responses:
 *     204:
 *      description: No Content
 *     400:
 *      description: Bad Request
 *     500:
 *      description: Internal Server Error
 */
ctrl.confirm();

export default ctrl.router;
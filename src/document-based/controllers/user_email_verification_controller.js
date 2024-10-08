import crudService from '../services/user_email_verification_service.js';
import userEmailVerificationController from '../../shared/controllers/user_email_verification_controller.js';

const ctrl = userEmailVerificationController(crudService);

/**
 * @openapi
 * '/api/v1/mongodb/user_email_verification/me/resend':
 *  post:
 *    tags:
 *     - MongoDB User Email Verification Controller
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
 * '/api/v1/mongodb/user_email_verification/{uuid}/confirm':
 *  get:
 *    tags:
 *     - MongoDB User Email Verification Controller
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

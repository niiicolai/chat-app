import channelAuditController from "./channel_audit_controller.js";
import channelAuditTypeController from "./channel_audit_type_controller.js";
import channelController from "./channel_controller.js";
import channelTypeController from "./channel_type_controller.js";
import channelMessageController from "./channel_message_controller.js";
import channelMessageTypeController from "./channel_message_type_controller.js";
import channelMessageUploadTypeController from "./channel_message_upload_type_controller.js";
import channelWebhookController from "./channel_webhook_controller.js";
import channelWebhookMessageTypeController from "./channel_webhook_message_type_controller.js";
import roomAuditController from "./room_audit_controller.js";
import roomAuditTypeController from "./room_audit_type_controller.js";
import roomCategoryController from "./room_category_controller.js";
import roomController from "./room_controller.js";
import roomFileController from "./room_file_controller.js";
import roomFileTypeController from "./room_file_type_controller.js";
import roomInviteLinkController from "./room_invite_link_controller.js";
import roomUserController from "./room_user_controller.js";
import roomUserRoleController from "./room_user_role_controller.js";
import userController from "./user_controller.js";
import userStatusStateController from "./user_status_state_controller.js";
import userEmailVerificationController from "./user_email_verification_controller.js";
/*
import userPasswordResetController from "./user_password_reset_controller.js";
import userStatusController from "./user_status_controller.js";
*/

const prefix = '/api/v1/mongodb';
const controllers = [
    channelAuditController,
    channelAuditTypeController,
    channelController,
    channelTypeController,
    channelMessageController,
    channelMessageTypeController,
    channelMessageUploadTypeController,
    channelWebhookController,
    channelWebhookMessageTypeController,
    roomAuditController,
    roomAuditTypeController,
    roomCategoryController,
    roomController,
    roomFileController,
    roomFileTypeController,
    roomInviteLinkController,
    roomUserController,
    roomUserRoleController,
    userController,
    userStatusStateController,
    userEmailVerificationController,
    /*
    userPasswordResetController,
    userStatusController,
    
    */
];

console.warn('WARNING: some controllers in _mongodb_controllers.js are commented out until services are implemented');

export default (app) => {
    for (const controller of controllers) {
        app.use(prefix, controller);
    }
}

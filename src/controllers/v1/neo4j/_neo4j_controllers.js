import channelAuditController from './channel_audit_controller.js';
import channelAuditTypeController from './channel_audit_type_controller.js';
import channelController from './channel_controller.js';
import channelMessageController from './channel_message_controller.js';
import channelMessageTypeController from './channel_message_type_controller.js';
import channelMessageUploadController from './channel_message_upload_controller.js';
import channelWebhookController from './channel_webhook_controller.js';
import channelWebhookMessageTypeController from './channel_webhook_message_type_controller.js';

const prefix = '/api/v1/neo4j';
const controllers = [
    channelAuditController,
    channelAuditTypeController,
    channelController,
    channelMessageController,
    channelMessageTypeController,
    channelMessageUploadController,
    channelWebhookController,
    channelWebhookMessageTypeController,
];

export default (app) => {
    for (const controller of controllers) {
        app.use(prefix, controller);
    }
}

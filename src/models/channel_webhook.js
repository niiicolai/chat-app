import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'channel_webhook',
    pluralName: 'channel_webhooks',
    mysql_table: 'channelwebhook',
    pk: 'uuid',
    fields: [
        'channel_uuid',
    ],
    requiredFields: [
        'channel_uuid',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

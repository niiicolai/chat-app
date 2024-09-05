import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'channel_message',
    pluralName: 'channel_messages',
    mysql_table: 'channelmessage',
    pk: 'uuid',
    fields: [
        'body',
        'channel_uuid',
        'user_uuid',
        'created_by_system',
    ],
    requiredFields: [
        'body',
        'channel_uuid',
        'user_uuid',
        'created_by_system',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

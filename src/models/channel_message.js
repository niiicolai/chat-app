import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'channel_message',
    pluralName: 'channel_messages',
    pk: 'uuid',
    fields: [
        'body',
        'channel_uuid',
        'user_uuid',
    ]
});

// Export the model
export default model;

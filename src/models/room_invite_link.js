import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room_invite_link',
    pluralName: 'room_invite_links',
    mysql_table: 'roominvitelink',
    pk: 'uuid',
    fields: [
        'room_uuid',
        'expires_at',
    ],
    requiredFields: [
        'room_uuid',
        'expires_at',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

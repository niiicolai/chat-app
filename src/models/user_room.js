import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'user_room',
    pluralName: 'user_rooms',
    mysql_table: 'userroom',
    pk: 'uuid',
    fields: [
        'room_uuid',
        'user_uuid',
        'room_role_name',
    ],
    requiredFields: [
        'room_uuid',
        'user_uuid',
        'room_role_name',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

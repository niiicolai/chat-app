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
    ]
});

// Export the model
export default model;

import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room_role',
    pluralName: 'room_roles',
    mysql_table: 'RoomRole',
    pk: 'name',
    fields: [
    ],
    requiredFields: [
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room_category',
    pluralName: 'room_categories',
    mysql_table: 'RoomCategory',
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

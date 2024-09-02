import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room',
    pluralName: 'rooms',
    mysql_table: 'room',
    pk: 'uuid',
    fields: [
        'name',
        'description',
        'room_category_name',
    ]
});

// Export the model
export default model;

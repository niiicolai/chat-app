import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room_category',
    pluralName: 'room_categories',
    pk: 'name',
    fields: [
    ]
});

// Export the model
export default model;

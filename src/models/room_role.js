import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room_role',
    pluralName: 'room_roles',
    pk: 'name',
    fields: [
    ]
});

// Export the model
export default model;

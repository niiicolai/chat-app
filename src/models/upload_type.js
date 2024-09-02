import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'upload_type',
    pluralName: 'upload_types',
    pk: 'name',
    fields: [
    ]
});

// Export the model
export default model;

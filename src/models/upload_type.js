import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'upload_type',
    pluralName: 'upload_types',
    mysql_table: 'uploadtype',
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

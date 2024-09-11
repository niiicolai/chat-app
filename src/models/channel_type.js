import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'channel_type',
    pluralName: 'channel_types',
    mysql_table: 'ChannelType',
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

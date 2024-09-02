import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'channel_type',
    pluralName: 'channel_types',
    mysql_table: 'channeltype',
    pk: 'name',
    fields: [
    ]
});

// Export the model
export default model;

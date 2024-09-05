import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'channel',
    pluralName: 'channels',
    mysql_table: 'channel',
    pk: 'uuid',
    fields: [
        'name',
        'description',
        'channel_type_name',
        'room_uuid',
    ],
    requiredFields: [
        'name',
        'description',
        'channel_type_name',
        'room_uuid',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

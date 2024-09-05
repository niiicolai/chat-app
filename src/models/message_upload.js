import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'message_upload',
    pluralName: 'message_uploads',
    mysql_table: 'messageupload',
    pk: 'uuid',
    fields: [
        'src',
        'upload_type_name',
        'size',
        'channel_message_uuid',
    ],
    requiredFields: [
        'src',
        'upload_type_name',
        'size',
        'channel_message_uuid',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

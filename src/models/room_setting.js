import BaseModel from './base_model.js';

// Define the model
const model = new BaseModel({
    singularName: 'room_setting',
    pluralName: 'room_settings',
    mysql_table: 'RoomSetting',
    pk: 'uuid',
    fields: [
        'total_upload_bytes',
        'upload_bytes',
        'join_channel_uuid',
        'join_message',
        'rules_text',
        'max_channels',
        'max_members',
        'room_uuid',
    ],
    requiredFields: [
        'total_upload_bytes',
        'upload_bytes',
        'join_message',
        'rules_text',
        'max_channels',
        'max_members',
        'room_uuid',
    ],
    create_timestamp: 'created_at',
    update_timestamp: 'updated_at',
});

// Export the model
export default model;

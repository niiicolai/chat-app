'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelMessageUploadView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelMessageUploadView.init({
        channel_message_upload_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_upload_uuid',
            primaryKey: true,
        },
        channel_message_upload_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_upload_type_name',
        },
        room_file_uuid: {
            type: DataTypes.UUID,
            field: 'room_file_uuid',
        },
        room_file_src: {
            type: DataTypes.STRING,
            field: 'room_file_src',
        },
        room_file_size: {
            type: DataTypes.INTEGER,
            field: 'room_file_size',
        },
        room_file_type_name: {
            type: DataTypes.STRING,
            field: 'room_file_type_name',
        },
        room_file_size_mb: {
            type: DataTypes.DOUBLE,
            field: 'room_file_size_mb',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelMessageUploadView',
        tableName: 'channel_message_upload_view',
        createdAt: 'channel_message_upload_created_at',
        updatedAt: 'channel_message_upload_updated_at',
    });
    return ChannelMessageUploadView;
};

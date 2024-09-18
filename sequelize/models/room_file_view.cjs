'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomFileView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomFileView.init({
        room_file_uuid: {
            type: DataTypes.UUID,
            field: 'room_file_uuid',
            primaryKey: true,
        },
        room_file_src: {
            type: DataTypes.TEXT,
            field: 'room_file_src',
        },
        room_file_size: {
            type: DataTypes.INTEGER,
            field: 'room_file_size',
        },
        room_file_size_mb: {
            type: DataTypes.DOUBLE,
            field: 'room_file_size_mb',
        },
        room_file_type_name: {
            type: DataTypes.STRING,
            field: 'room_file_type_name',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        channel_message_upload_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_upload_uuid',
        },
        channel_message_upload_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_upload_type_name',
        },
        channel_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_uuid',
        },
        channel_message_body: {
            type: DataTypes.TEXT,
            field: 'channel_message_body',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
        user_username: {
            type: DataTypes.STRING,
            field: 'user_username',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomFileView',
        tableName: 'room_file_view',
        createdAt: 'room_file_created_at',
        updatedAt: 'room_file_updated_at',
    });
    return RoomFileView;
};

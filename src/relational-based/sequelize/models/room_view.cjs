'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.RoomView.hasMany(models.RoomUserView, {
                foreignKey: 'room_uuid',
                sourceKey: 'room_uuid',
            });
        }
    }
    RoomView.init({
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
            primaryKey: true,
        },
        room_name: {
            type: DataTypes.STRING,
            field: 'room_name',
        },
        room_description: {
            type: DataTypes.TEXT,
            field: 'room_description',
        },
        room_category_name: {
            type: DataTypes.STRING,
            field: 'room_category_name',
        },
        join_channel_uuid: {
            type: DataTypes.UUID,
            field: 'join_channel_uuid',
        },
        join_message: {
            type: DataTypes.TEXT,
            field: 'join_message',
        },
        rules_text: {
            type: DataTypes.TEXT,
            field: 'rules_text',
        },
        max_users: {
            type: DataTypes.INTEGER,
            field: 'max_users',
        },
        max_channels: {
            type: DataTypes.INTEGER,
            field: 'max_channels',
        },
        message_days_to_live: {
            type: DataTypes.INTEGER,
            field: 'message_days_to_live',
        },
        total_files_bytes_allowed: {
            type: DataTypes.INTEGER,
            field: 'total_files_bytes_allowed',
        },
        single_file_bytes_allowed: {
            type: DataTypes.INTEGER,
            field: 'single_file_bytes_allowed',
        },
        file_days_to_live: {
            type: DataTypes.INTEGER,
            field: 'file_days_to_live',
        },
        total_files_mb: {
            type: DataTypes.DOUBLE,
            field: 'total_files_mb',
        },
        single_file_mb: {
            type: DataTypes.DOUBLE,
            field: 'single_file_mb',
        },
        bytes_used: {
            type: DataTypes.INTEGER,
            field: 'bytes_used',
        },
        mb_used: {
            type: DataTypes.DOUBLE,
            field: 'mb_used',
        },
        room_avatar_uuid: {
            type: DataTypes.UUID,
            field: 'room_avatar_uuid',
        },
        room_file_uuid: {
            type: DataTypes.TEXT,
            field: 'room_file_uuid',
        },
        room_file_src: {
            type: DataTypes.TEXT,
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
        modelName: 'RoomView',
        tableName: 'room_view',
        createdAt: 'room_created_at',
        updatedAt: 'room_updated_at',
    });
    return RoomView;
};

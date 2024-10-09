'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelMessageView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.ChannelMessageView.belongsTo(models.ChannelView, {
                foreignKey: 'channel_uuid',
                targetKey: 'channel_uuid',
            });
        }
    }
    ChannelMessageView.init({
        channel_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_uuid',
            primaryKey: true,
        },
        channel_message_body: {
            type: DataTypes.TEXT,
            field: 'channel_message_body',
        },
        channel_message_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_type_name',
        },
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
        user_username: {
            type: DataTypes.STRING,
            field: 'user_username',
        },
        user_avatar_src: {
            type: DataTypes.TEXT,
            field: 'user_avatar_src',
        },
        channel_message_upload_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_upload_uuid',
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
        channel_webhook_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_message_uuid',
        },
        channel_webhook_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_uuid',
        },
        channel_webhook_name: {
            type: DataTypes.STRING,
            field: 'channel_webhook_name',
        },
        channel_webhook_room_file_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_room_file_uuid',
        },
        channel_webhook_room_file_src: {
            type: DataTypes.TEXT,
            field: 'channel_webhook_room_file_src',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelMessageView',
        tableName: 'channel_message_view',
        createdAt: 'channel_message_created_at',
        updatedAt: 'channel_message_updated_at',
    });
    return ChannelMessageView;
};

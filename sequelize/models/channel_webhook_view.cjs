'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelWebhookView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelWebhookView.init({
        channel_webhook_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_uuid',
            primaryKey: true,
        },
        channel_webhook_name: {
            type: DataTypes.STRING,
            field: 'channel_webhook_name',
        },
        channel_webhook_description: {
            type: DataTypes.TEXT,
            field: 'channel_webhook_description',
        },
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        room_file_uuid: {
            type: DataTypes.UUID,
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
        modelName: 'ChannelWebhookView',
        tableName: 'channel_webhook_view',
        createdAt: 'channel_webhook_created_at',
        updatedAt: 'channel_webhook_updated_at',
    });
    return ChannelWebhookView;
};

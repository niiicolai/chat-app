'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelWebhookMessageView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelWebhookMessageView.init({
        channel_webhook_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_message_uuid',
            primaryKey: true,
        },
        channel_webhook_message_body: {
            type: DataTypes.TEXT,
            field: 'channel_webhook_message_body',
        },
        channel_webhook_message_type_name: {
            type: DataTypes.STRING,
            field: 'channel_webhook_message_type_name',
        },
        channel_webhook_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_uuid',
        },
        channel_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_uuid',
        },
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelWebhookMessageView',
        tableName: 'channel_webhook_message_view',
        createdAt: 'channel_webhook_message_created_at',
        updatedAt: 'channel_webhook_message_updated_at',
    });
    return ChannelWebhookMessageView;
};

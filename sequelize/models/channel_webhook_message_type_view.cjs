'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelWebhookMessageTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelWebhookMessageTypeView.init({
        channel_webhook_message_type_name: {
            type: DataTypes.STRING,
            field: 'channel_webhook_message_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelWebhookMessageTypeView',
        tableName: 'channel_webhook_message_type_view',
        createdAt: 'channel_webhook_message_type_created_at',
        updatedAt: 'channel_webhook_message_type_updated_at',
    });
    return ChannelWebhookMessageTypeView;
};

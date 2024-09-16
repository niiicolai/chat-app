'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelMessageTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelMessageTypeView.init({
        channel_message_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelMessageTypeView',
        tableName: 'channel_message_type_view',
        createdAt: 'channel_message_type_created_at',
        updatedAt: 'channel_message_type_updated_at',
    });
    return ChannelMessageTypeView;
};

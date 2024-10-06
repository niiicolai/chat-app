'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelMessageReactionView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelMessageReactionView.init({
        channel_message_reaction_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_reaction_uuid',
            primaryKey: true,
        },
        reaction: {
            type: DataTypes.STRING,
            field: 'reaction',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
        channel_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelMessageReactionView',
        tableName: 'channel_message_reaction_view',
        createdAt: 'channel_message_reaction_created_at',
        updatedAt: 'channel_message_reaction_updated_at',
    });
    return ChannelMessageReactionView;
};

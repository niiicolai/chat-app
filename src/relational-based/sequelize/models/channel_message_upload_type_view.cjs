'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelMessageUploadTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelMessageUploadTypeView.init({
        channel_message_upload_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_upload_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelMessageUploadTypeView',
        tableName: 'channel_message_upload_type_view',
        createdAt: 'channel_message_upload_type_created_at',
        updatedAt: 'channel_message_upload_type_updated_at',
    });
    return ChannelMessageUploadTypeView;
};

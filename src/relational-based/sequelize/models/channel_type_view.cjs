'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelTypeView.init({
        channel_type_name: {
            type: DataTypes.STRING,
            field: 'channel_type_name',
            primaryKey: true,
        },
    }, { 
        sequelize,
        timestamps: true,
        modelName: 'ChannelTypeView',
        tableName: 'channel_type_view',
        createdAt: 'channel_type_created_at',
        updatedAt: 'channel_type_updated_at',
    });
    return ChannelTypeView;
};

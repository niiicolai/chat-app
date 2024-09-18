'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.ChannelView.hasMany(models.ChannelMessageView, {
                foreignKey: 'channel_uuid',
                sourceKey: 'channel_uuid',
            });
        }
    }
    ChannelView.init({
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
            primaryKey: true,
        },
        channel_name: {
            type: DataTypes.STRING,
            field: 'channel_name',
        },
        channel_description: {
            type: DataTypes.STRING,
            field: 'channel_description',
        },
        channel_type_name: {
            type: DataTypes.STRING,
            field: 'channel_type_name',
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
            type: DataTypes.INTEGER,
            field: 'room_file_size_mb',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelView',
        tableName: 'channel_view',
        createdAt: 'channel_created_at',
        updatedAt: 'channel_updated_at',
    });
    return ChannelView;
};

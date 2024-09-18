'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomAvatarView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomAvatarView.init({
        room_avatar_uuid: {
            type: DataTypes.UUID,
            field: 'room_avatar_uuid',
            primaryKey: true,
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        room_file_uuid: {
            type: DataTypes.UUID,
            field: 'room_file_uuid',
        },
        room_avatar_src: {
            type: DataTypes.TEXT,
            field: 'room_avatar_src',
        },
        room_avatar_size: {
            type: DataTypes.INTEGER,
            field: 'room_avatar_size',
        },
        room_avatar_type_name: {
            type: DataTypes.STRING,
            field: 'room_avatar_type_name',
        },
        room_avatar_size_mb: {
            type: DataTypes.DOUBLE,
            field: 'room_avatar_size_mb',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomAvatarView',
        tableName: 'room_avatar_view',
        createdAt: 'room_avatar_created_at',
        updatedAt: 'room_avatar_updated_at',
    });
    return RoomAvatarView;
};

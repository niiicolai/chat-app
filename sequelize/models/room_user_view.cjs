'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomUserView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.RoomUserView.belongsTo(models.RoomView, {
                foreignKey: 'room_uuid',
                targetKey: 'room_uuid',
            });
        }
    }
    RoomUserView.init({
        room_user_uuid: {
            type: DataTypes.UUID,
            field: 'room_user_uuid',
            primaryKey: true,
        },
        room_user_role_name: {
            type: DataTypes.STRING,
            field: 'room_user_role_name',
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
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomUserView',
        tableName: 'room_user_view',
        createdAt: 'room_user_created_at',
        updatedAt: 'room_user_updated_at',
    });
    return RoomUserView;
};

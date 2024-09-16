'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomUserRoleView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomUserRoleView.init({
        room_user_role_name: {
            type: DataTypes.STRING,
            field: 'room_user_role_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomUserRoleView',
        tableName: 'room_user_role_view',
        createdAt: 'room_user_role_created_at',
        updatedAt: 'room_user_role_updated_at',
    });
    return RoomUserRoleView;
};

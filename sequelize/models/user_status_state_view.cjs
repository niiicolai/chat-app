'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserStatusStateView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    UserStatusStateView.init({
        user_status_state_name: {
            type: DataTypes.STRING,
            field: 'user_status_state_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserStatusStateView',
        tableName: 'user_status_state_view',
        createdAt: 'user_status_state_created_at',
        updatedAt: 'user_status_state_updated_at',
    });
    return UserStatusStateView;
};

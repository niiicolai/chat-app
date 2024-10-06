'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserPasswordResetView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    UserPasswordResetView.init({
        user_password_reset_uuid: {
            type: DataTypes.UUID,
            field: 'user_password_reset_uuid',
            primaryKey: true,
        },
        user_password_reset_expires_at: {
            type: DataTypes.DATE,
            field: 'user_password_reset_expires_at',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserPasswordResetView',
        tableName: 'user_password_reset_view',
        createdAt: 'user_password_reset_created_at',
        updatedAt: 'user_password_reset_updated_at',
    });
    return UserPasswordResetView;
};

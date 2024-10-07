'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserEmailVerificationView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    UserEmailVerificationView.init({
        user_email_verification_uuid: {
            type: DataTypes.UUID,
            field: 'user_email_verification_uuid',
            primaryKey: true,
        },
        user_email_verified: {
            type: DataTypes.DATE,
            field: 'user_email_verified',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserEmailVerificationView',
        tableName: 'user_email_verification_view',
        createdAt: 'user_email_verification_created_at',
        updatedAt: 'user_email_verification_updated_at',
    });
    return UserEmailVerificationView;
};

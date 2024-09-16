'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    UserView.init({
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
            primaryKey: true,
        },
        user_username: {
            type: DataTypes.STRING,
            field: 'user_username',
        },
        user_email: {
            type: DataTypes.STRING,
            field: 'user_email',
        },
        user_password: {
            type: DataTypes.STRING,
            field: 'user_password',
        },
        user_avatar_src: {
            type: DataTypes.TEXT,
            field: 'user_avatar_src',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserView',
        tableName: 'user_view',
        createdAt: 'user_created_at',
        updatedAt: 'user_updated_at',
    });
    return UserView;
};

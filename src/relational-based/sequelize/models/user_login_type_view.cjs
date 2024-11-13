'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserLoginTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    UserLoginTypeView.init({
        user_login_type_name: {
            type: DataTypes.STRING,
            field: 'user_login_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserLoginTypeView',
        tableName: 'user_login_type_view',
        createdAt: 'user_login_type_created_at',
        updatedAt: 'user_login_type_updated_at',
    });
    return UserLoginTypeView;
};

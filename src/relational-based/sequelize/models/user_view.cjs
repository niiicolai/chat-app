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
        user_avatar_src: {
            type: DataTypes.TEXT,
            field: 'user_avatar_src',
        },
        user_email_verified: {
            type: DataTypes.BOOLEAN,
            field: 'user_email_verified',
        },
        user_status_uuid: {
            type: DataTypes.UUID,
            field: 'user_status_uuid',
        },
        user_status_state_name: {
            type: DataTypes.STRING,
            field: 'user_status_state_name',
        },
        user_status_message: {
            type: DataTypes.TEXT,
            field: 'user_status_message',
        },
        user_status_last_seen_at: {
            type: DataTypes.DATE,
            field: 'user_status_last_seen_at',
        },
        user_status_total_online_hours: {
            type: DataTypes.INTEGER,
            field: 'user_status_total_online_hours',
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

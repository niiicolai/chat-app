'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserStatusView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    UserStatusView.init({
        user_status_uuid: {
            type: DataTypes.UUID,
            field: 'user_status_uuid',
            primaryKey: true,
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
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserStatusView',
        tableName: 'user_status_view',
        createdAt: 'user_status_created_at',
        updatedAt: 'user_status_updated_at',
    });
    return UserStatusView;
};

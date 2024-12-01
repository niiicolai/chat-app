'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserStatusView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.UserStatusView.belongsTo(models.UserView, {
                foreignKey: 'user_uuid',
                targetKey: 'user_uuid',
            });
            models.UserStatusView.hasOne(models.UserStatusStateView, {
                foreignKey: 'user_status_state_name',
                sourceKey: 'user_status_state_name',
            });
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

    /**
     * @function updateUserStatusProc
     * @description Update a user status using a stored procedure.
     * @param {Object} replacements
     * @param {string} replacements.user_uuid optional
     * @param {string} replacements.user_status_state optional
     * @param {string} replacements.message optional
     * @param {Date} replacements.last_seen_at optional
     * @param {number} replacements.user_status_total_online_hours optional
     * @param {Object} transaction optional
     */
    UserStatusView.prototype.updateUserStatusProc = async function (replacements, transaction) {
        if (!replacements.user_uuid) replacements.user_uuid = this.user_uuid;
        if (!replacements.user_status_state) replacements.user_status_state = this.user_status_state_name;
        if (!replacements.message) replacements.message = this.user_status_message;
        if (!replacements.last_seen_at) replacements.last_seen_at = this.user_status_last_seen_at;
        if (!replacements.user_status_total_online_hours) replacements.user_status_total_online_hours = this.user_status_total_online_hours;

        await sequelize.query('CALL update_user_status_proc(:user_uuid, :user_status_state, :message, :last_seen_at, :user_status_total_online_hours, @result)', {
            replacements,
            ...(transaction && { transaction }),
        });
    }

    return UserStatusView;
};

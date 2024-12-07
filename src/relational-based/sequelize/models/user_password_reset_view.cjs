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

        /**
         * @function deleteUserPasswordResetProc
         * @description Delete a user password reset using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteUserPasswordResetProc(replacements, transaction) {
            if (!replacements) throw new Error('deleteUserPasswordResetProc: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteUserPasswordResetProc: No uuid provided');

            await sequelize.query('CALL delete_user_password_reset_proc(:uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteUserPasswordResetProc
         * @description Delete a user password reset using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteUserPasswordResetProc(transaction) {
            await UserPasswordResetView.deleteUserPasswordResetProc({ uuid: this.user_password_reset_uuid }, transaction);
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

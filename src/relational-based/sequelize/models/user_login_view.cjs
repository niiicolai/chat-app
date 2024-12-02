'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserLoginView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }

        /**
         * @function deleteUserLoginProc
         * @description Delete a user login using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteUserLoginProc(replacements, transaction) {
            if (!replacements) throw new Error('deleteUserLoginProc: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteUserLoginProc: No uuid provided');

            await sequelize.query('CALL delete_user_login_proc(:uuid)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editUserLoginProcStatic
         * @description Edit a user login using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_login_uuid
         * @param {string} replacements.user_login_type_name
         * @param {string} replacements.user_login_password optional
         * @param {string} replacements.third_party_id optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editUserLoginProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editUserLoginProcStatic: No replacements provided');
            if (!replacements.user_login_uuid) throw new Error('editUserLoginProcStatic: No user_login_uuid provided');
            if (!replacements.user_login_type_name) throw new Error('editUserLoginProcStatic: No user_login_type_name provided');
            
            if (replacements.user_login_type_name === 'Password') {
                if (!replacements.user_login_password) throw new Error('createUserLoginProcStatic: No user_login_password provided');
            } else replacements.user_login_password = null;

            if (replacements.user_login_type_name !== 'Password') {
                if (!replacements.third_party_id) throw new Error('createUserLoginProcStatic: No third_party_id provided');
            } else replacements.third_party_id = null;

            await sequelize.query('CALL edit_user_login_proc(:user_login_uuid, :user_login_type_name, :user_login_password, :third_party_id)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /** 
         * @function deleteUserLoginProc
         * @description Delete a user login using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteUserLoginProc(transaction) {
            await UserLoginView.deleteUserLoginProc({ uuid: this.user_login_uuid }, transaction);
        }

        /**
         * @function editUserLoginProc
         * @description Edit a user login using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_login_password optional
         * @param {string} replacements.third_party_id optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editUserLoginProc(replacements, transaction) {
            await UserLoginView.editUserLoginProcStatic({ 
                user_login_uuid: this.user_login_uuid, 
                user_login_type_name: this.user_login_type_name,
            ...replacements }, transaction);
        }
    }
    UserLoginView.init({
        user_login_uuid: {
            type: DataTypes.UUID,
            field: 'user_login_uuid',
            primaryKey: true,
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
        user_login_type_name: {
            type: DataTypes.STRING,
            field: 'user_login_type_name',
        },
        user_login_password: {
            type: DataTypes.STRING,
            field: 'user_login_password',
        },
        user_login_third_party_id: {
            type: DataTypes.STRING,
            field: 'user_login_third_party_id',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserLoginView',
        tableName: 'user_login_view',
        createdAt: 'user_login_created_at',
        updatedAt: 'user_login_updated_at',
    });
    return UserLoginView;
};

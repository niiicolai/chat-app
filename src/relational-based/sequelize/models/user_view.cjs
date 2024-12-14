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
            models.UserView.hasOne(models.UserStatusView, {
                foreignKey: 'user_uuid',
                sourceKey: 'user_uuid',
            });
        }

        /**
         * @function createUserProcStatic
         * @description Create a user using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.username
         * @param {string} replacements.email
         * @param {string} replacements.avatar optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createUserProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createUserProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('createUserProcStatic: No uuid provided');
            if (!replacements.username) throw new Error('createUserProcStatic: No username provided');
            if (!replacements.email) throw new Error('createUserProcStatic: No email provided');
            if (!replacements.avatar) replacements.avatar = null;

            await sequelize.query('CALL create_user_proc(:uuid, :username, :email, :avatar)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editUserProcStatic
         * @description Edit a user using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.username
         * @param {string} replacements.email
         * @param {string} replacements.avatar optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editUserProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editUserProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('editUserProcStatic: No uuid provided');
            if (!replacements.username) throw new Error('editUserProcStatic: No username provided');
            if (!replacements.email) throw new Error('editUserProcStatic: No email provided');
            if (!replacements.avatar) replacements.avatar = null;

            await sequelize.query('CALL edit_user_proc(:uuid, :username, :email, :avatar)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteUserProcStatic
         * @description Delete a user using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteUserProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteUserProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteUserProcStatic: No uuid provided');

            await sequelize.query('CALL delete_user_proc(:uuid)', {
                replacements,
                transaction
            });
        }

        /**
         * @function deleteUserAvatarProcStatic
         * @description Delete a user avatar using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteUserAvatarProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteUserAvatarProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteUserAvatarProcStatic: No uuid provided');

            await sequelize.query('CALL delete_user_avatar_proc(:uuid)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function createUserLoginProcStatic
         * @description Create a user login using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.login_uuid
         * @param {string} replacements.user_login_type_name
         * @param {string} replacements.user_login_password optional
         * @param {string} replacements.third_party_id optional
         * @param {string} replacements.user_uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createUserLoginProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createUserLoginProcStatic: No replacements provided');
            if (!replacements.login_uuid) throw new Error('createUserLoginProcStatic: No login_uuid provided');
            if (!replacements.user_login_type_name) throw new Error('createUserLoginProcStatic: No user_login_type_name provided');
            if (!replacements.user_uuid) throw new Error('createUserLoginProcStatic: No user_uuid provided');

            if (replacements.user_login_type_name === 'Password') {
                if (!replacements.user_login_password) throw new Error('createUserLoginProcStatic: No user_login_password provided');
            } else replacements.user_login_password = null;

            if (replacements.user_login_type_name !== 'Password') {
                if (!replacements.third_party_id) throw new Error('createUserLoginProcStatic: No third_party_id provided');
            } else replacements.third_party_id = null;
            
            await sequelize.query('CALL create_user_login_proc(:login_uuid, :user_uuid, :user_login_type_name, :third_party_id, :user_login_password)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function setUserEmailVerificationProcStatic
         * @description Set a user's email verification using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {boolean} replacements.is_verified
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async setUserEmailVerificationProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('setUserEmailVerificationProcStatic: No replacements provided');
            if (!replacements.user_uuid) throw new Error('setUserEmailVerificationProcStatic: No uuid provided');
            if (typeof replacements.is_verified !== 'boolean') throw new Error('setUserEmailVerificationProcStatic: No is_verified provided');

            await sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :is_verified)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function createUserPasswordResetProcStatic
         * @description Create a user password reset using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.user_uuid
         * @param {string} replacements.expires_at optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createUserPasswordResetProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createUserPasswordResetProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('createUserPasswordResetProcStatic: No uuid provided');
            if (!replacements.user_uuid) throw new Error('createUserPasswordResetProcStatic: No user_uuid provided');
            if (!replacements.expires_at) throw new Error('createUserPasswordResetProcStatic: No expires_at provided');

            await sequelize.query('CALL create_user_password_reset_proc(:uuid, :user_uuid, :expires_at)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editUserProc
         * @description Edit a user using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.username optional
         * @param {string} replacements.email optional
         * @param {string} replacements.avatar optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editUserProc(replacements, transaction) {
            if (!replacements) throw new Error('editUserProc: No replacements provided');
            if (!replacements.username) replacements.username = this.user_username;
            if (!replacements.email) replacements.email = this.user_email;
            if (!replacements.avatar) replacements.avatar = this.user_avatar_src;
            
            await UserView.editUserProcStatic({ ...replacements, uuid: this.user_uuid }, transaction);
        }

        /**
         * @function deleteUserProc
         * @description Delete a user using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteUserProc(transaction) {
            await UserView.deleteUserProcStatic({ uuid: this.user_uuid }, transaction);
        }

        /**
         * @function deleteUserAvatarProc
         * @description Delete a user avatar using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteUserAvatarProc(transaction) {
            await UserView.deleteUserAvatarProcStatic({ uuid: this.user_uuid }, transaction);
        }

        /**
         * @function createUserLoginProc
         * @description Create a user login using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.login_uuid
         * @param {string} replacements.user_login_type_name
         * @param {string} replacements.user_login_password optional
         * @param {string} replacements.third_party_id optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async createUserLoginProc(replacements, transaction) {
            replacements.user_uuid = this.user_uuid;
            await UserView.createUserLoginProcStatic({ ...replacements, user_uuid: this.user_uuid }, transaction);
        }

        /**
         * @function setUserEmailVerificationProc
         * @description Set a user's email verification using a stored procedure.
         * @param {Object} replacements
         * @param {boolean} replacements.is_verified
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async setUserEmailVerificationProc(replacements, transaction) {
            replacements.user_uuid = this.user_uuid;
            await UserView.setUserEmailVerificationProcStatic({ ...replacements, user_uuid: this.user_uuid }, transaction);
        }

        /**
         * @function createUserPasswordResetProc
         * @description Create a user password reset using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.expires_at
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async createUserPasswordResetProc(replacements, transaction) {
            replacements.user_uuid = this.user_uuid;
            await UserView.createUserPasswordResetProcStatic({ ...replacements, user_uuid: this.user_uuid }, transaction);
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

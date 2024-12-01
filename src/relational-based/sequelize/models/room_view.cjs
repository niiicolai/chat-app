'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.RoomView.hasMany(models.RoomUserView, {
                foreignKey: 'room_uuid',
                sourceKey: 'room_uuid',
            });
        }

        /**
         * @function createRoomProcStatic
         * @description Create a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {string} replacements.uuid
         * @param {string} replacements.name
         * @param {string} replacements.description
         * @param {string} replacements.room_category_name
         * @param {string} replacements.room_user_role
         * @param {string} replacements.src - optional
         * @param {number} replacements.bytes - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createRoomProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createRoomProcStatic: No replacements provided');
            if (!replacements.user_uuid) throw new Error('createRoomProcStatic: No user_uuid provided');
            if (!replacements.uuid) throw new Error('createRoomProcStatic: No uuid provided');
            if (!replacements.name) throw new Error('createRoomProcStatic: No name provided');
            if (!replacements.description) throw new Error('createRoomProcStatic: No description provided');
            if (!replacements.room_category_name) throw new Error('createRoomProcStatic: No room_category_name provided');
            if (!replacements.room_user_role) throw new Error('createRoomProcStatic: No room_user_role provided');
            if (!replacements.src) replacements.src = null;
            if (!replacements.bytes) replacements.bytes = null;

            await sequelize.query('CALL create_room_proc(:user_uuid, :uuid, :name, :description, :room_category_name, :room_user_role, :src, :bytes, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editRoomProcStatic
         * @description Edit a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.name
         * @param {string} replacements.description
         * @param {string} replacements.room_category_name
         * @param {string} replacements.src - optional
         * @param {number} replacements.bytes - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editRoomProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editRoomProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('editRoomProcStatic: No uuid provided');
            if (!replacements.name) throw new Error('editRoomProcStatic: No name provided');
            if (!replacements.description) throw new Error('editRoomProcStatic: No description provided');
            if (!replacements.room_category_name) throw new Error('editRoomProcStatic: No room_category_name provided');
            if (!replacements.src) replacements.src = null;
            if (!replacements.bytes) replacements.bytes = null;

            await sequelize.query('CALL edit_room_proc(:uuid, :name, :description, :room_category_name, :src, :bytes, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editRoomSettingProcStatic
         * @description Edit a room setting using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.join_message
         * @param {string} replacements.rules_text
         * @param {string} replacements.join_channel_uuid - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editRoomSettingProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editRoomSettingProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('editRoomSettingProcStatic: No uuid provided');
            if (!replacements.join_message) throw new Error('editRoomSettingProcStatic: No join_message provided');
            if (!replacements.rules_text) throw new Error('editRoomSettingProcStatic: No rules_text provided');
            if (!replacements.join_channel_uuid) replacements.join_channel_uuid = null;

            await sequelize.query('CALL edit_room_setting_proc(:uuid, :join_message, :join_channel_uuid, :rules_text, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function leaveRoomProcStatic
         * @description Leave a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async leaveRoomProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('leaveRoomProcStatic: No replacements provided');
            if (!replacements.user_uuid) throw new Error('leaveRoomProcStatic: No user_uuid provided');
            if (!replacements.uuid) throw new Error('leaveRoomProcStatic: No uuid provided');

            await sequelize.query('CALL leave_room_proc(:user_uuid, :uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteRoomProcStatic
         * @description Delete a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteRoomProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteRoomProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteRoomProcStatic: No uuid provided');

            await sequelize.query('CALL delete_room_proc(:uuid, @result)', {
                replacements,
                transaction
            });
        }

        /**
         * @function joinRoomProcStatic
         * @description Join a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {string} replacements.room_uuid
         * @param {string} replacements.role_name
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async joinRoomProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('joinRoomProcStatic: No replacements provided');
            if (!replacements.user_uuid) throw new Error('joinRoomProcStatic: No user_uuid provided');
            if (!replacements.room_uuid) throw new Error('joinRoomProcStatic: No room_uuid provided');
            if (!replacements.role_name) throw new Error('joinRoomProcStatic: No role_name provided');

            await sequelize.query('CALL join_room_proc(:user_uuid, :room_uuid, :role_name, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function leaveRoomProcStatic
         * @description Leave a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {string} replacements.room_uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async leaveRoomProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('leaveRoomProcStatic: No replacements provided');
            if (!replacements.user_uuid) throw new Error('leaveRoomProcStatic: No user_uuid provided');
            if (!replacements.room_uuid) throw new Error('leaveRoomProcStatic: No room_uuid provided');

            await sequelize.query('CALL leave_room_proc(:user_uuid, :room_uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function checkUploadExceedsTotalProcStatic
         * @description Check if an upload exceeds the total file size allowed by a room using a stored procedure.
         * @param {Object} replacements
         * @param {number} replacements.bytes
         * @param {string} replacements.room_uuid
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @static
         */
        static async checkUploadExceedsTotalProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('checkUploadExceedsTotalProcStatic: No replacements provided');
            if (!replacements.bytes) throw new Error('checkUploadExceedsTotalProcStatic: No bytes provided');
            if (!replacements.room_uuid) throw new Error('checkUploadExceedsTotalProcStatic: No room_uuid provided');

            await sequelize.query('CALL check_upload_exceeds_total_proc(:bytes, :room_uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });

            const [[{ result }]] = await sequelize.query('SELECT @result AS result', {
                ...(transaction && { transaction }),
            });

            return (result === 1);
        }

        static async checkUploadExceedsSingleProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('checkUploadExceedsSingleProcStatic: No replacements provided');
            if (!replacements.bytes) throw new Error('checkUploadExceedsSingleProcStatic: No bytes provided');
            if (!replacements.room_uuid) throw new Error('checkUploadExceedsSingleProcStatic: No room_uuid provided');

            await sequelize.query('CALL check_upload_exceeds_single_proc(:bytes, :room_uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });

            const [[{ result }]] = await sequelize.query('SELECT @result AS result', {
                ...(transaction && { transaction }),
            });

            return (result === 1);
        }

        /**
         * @function checkUsersExceedsTotalProcStatic
         * @description Check if adding x number of users to a room exceeds the user limit.
         * @param {Object} replacements
         * @param {string} replacements.room_uuid
         * @param {number} replacements.add_count
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @static
         */
        static async checkUsersExceedsTotalProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('checkUsersExceedsTotalProcStatic: No replacements provided');
            if (!replacements.room_uuid) throw new Error('checkUsersExceedsTotalProcStatic: No room_uuid provided');
            if (!replacements.add_count) throw new Error('checkUsersExceedsTotalProcStatic: No add_count provided');

            await sequelize.query('CALL check_users_exceeds_total_proc(:room_uuid, :add_count, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });

            const [[{ result }]] = await sequelize.query('SELECT @result AS result', {
                ...(transaction && { transaction }),
            });

            return (result === 1);
        }

        /**
         * @function checkChannelsExceedsTotalProcStatic
         * @description Check if adding x number of channels to a room exceeds the channel limit.
         * @param {Object} replacements
         * @param {string} replacements.room_uuid
         * @param {number} replacements.add_count
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @static
         */
        static async checkChannelsExceedsTotalProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('checkChannelsExceedsTotalProcStatic: No replacements provided');
            if (!replacements.room_uuid) throw new Error('checkChannelsExceedsTotalProcStatic: No room_uuid provided');
            if (!replacements.add_count) throw new Error('checkChannelsExceedsTotalProcStatic: No add_count provided');

            await sequelize.query('CALL check_channels_exceeds_total_proc(:room_uuid, :add_count, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });

            const [[{ result }]] = await sequelize.query('SELECT @result AS result', {
                ...(transaction && { transaction }),
            });

            return (result === 1);
        }

        /**
         * @function joinRoomProc
         * @description Join a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {string} replacements.role_name
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async joinRoomProc(replacements, transaction) {
            if (!replacements) throw new Error('joinRoomProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            await RoomView.joinRoomProcStatic(replacements, transaction);
        }

        /**
         * @function leaveRoomProc
         * @description Leave a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async leaveRoomProc(replacements, transaction) {
            if (!replacements) throw new Error('leaveRoomProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            await RoomView.leaveRoomProcStatic(replacements, transaction);
        }

        /**
         * @function editRoomProc
         * @description Edit a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.name - optional
         * @param {string} replacements.description - optional
         * @param {string} replacements.room_category_name - optional
         * @param {string} replacements.src - optional
         * @param {number} replacements.bytes - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editRoomProc(replacements, transaction) {
            if (!replacements) throw new Error('editRoomProc: No replacements provided');
            if (!replacements.name) replacements.name = this.room_name;
            if (!replacements.description) replacements.description = this.room_description;
            if (!replacements.room_category_name) replacements.room_category_name = this.room_category_name;
            if (!replacements.src) replacements.src = this.room_file_src;
            if (!replacements.bytes) replacements.bytes = this.room_file_size;

            replacements.uuid = this.room_uuid;

            await RoomView.editRoomProcStatic(replacements, transaction);
        }

        /**
         * @function editRoomSettingProc
         * @description Edit a room setting using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.join_message - optional
         * @param {string} replacements.rules_text - optional
         * @param {string} replacements.join_channel_uuid - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editRoomSettingProc(replacements, transaction) {
            if (!replacements) throw new Error('editRoomSettingProc: No replacements provided');
            if (!replacements.join_message) replacements.join_message = this.join_message;
            if (!replacements.rules_text) replacements.rules_text = this.rules_text;
            if (!replacements.join_channel_uuid) replacements.join_channel_uuid = this.join_channel_uuid;

            replacements.uuid = this.room_uuid;

            await RoomView.editRoomSettingProcStatic(replacements, transaction);
        }

        /**
         * @function leaveRoomProc
         * @description Leave a room using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async leaveRoomProc(replacements, transaction) {
            if (!replacements) throw new Error('leaveRoomProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            await RoomView.leaveRoomProcStatic(replacements, transaction);
        }

        /**
         * @function deleteRoomProc
         * @description Delete a room using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteRoomProc(transaction) {
            await RoomView.deleteRoomProcStatic({ uuid: this.room_uuid }, transaction);
        }

        /**
         * @function checkUploadExceedsTotalProc
         * @description Check if an upload exceeds the total file size allowed by a room using a stored procedure.
         * @param {Object} replacements
         * @param {number} replacements.bytes
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @instance
         */
        async checkUploadExceedsTotalProc(replacements, transaction) {
            if (!replacements) throw new Error('checkUploadExceedsTotalProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            return await RoomView.checkUploadExceedsTotalProcStatic(replacements, transaction);
        }

        /**
         * @function checkUploadExceedsSingleProc
         * @description Check if an upload exceeds the single file size allowed by a room using a stored procedure.
         * @param {Object} replacements
         * @param {number} replacements.bytes
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @instance
         */
        async checkUploadExceedsSingleProc(replacements, transaction) {
            if (!replacements) throw new Error('checkUploadExceedsSingleProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            return await RoomView.checkUploadExceedsSingleProcStatic(replacements, transaction);
        }

        /**
         * @function checkUsersExceedsTotalProc
         * @description Check if adding x number of users to a room exceeds the user limit.
         * @param {Object} replacements
         * @param {number} replacements.add_count
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @instance
         */
        async checkUsersExceedsTotalProc(replacements, transaction) {
            if (!replacements) throw new Error('checkUsersExceedsTotalProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            return await RoomView.checkUsersExceedsTotalProcStatic(replacements, transaction);
        }

        /**
         * @function checkChannelsExceedsTotalProc
         * @description Check if adding x number of channels to a room exceeds the channel limit.
         * @param {Object} replacements
         * @param {number} replacements.add_count
         * @param {Object} transaction optional
         * @returns {Promise<boolean>}
         * @instance
         */
        async checkChannelsExceedsTotalProc(replacements, transaction) {
            if (!replacements) throw new Error('checkChannelsExceedsTotalProc: No replacements provided');
            replacements.room_uuid = this.room_uuid;
            return await RoomView.checkChannelsExceedsTotalProcStatic(replacements, transaction);
        }
    }
    RoomView.init({
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
            primaryKey: true,
        },
        room_name: {
            type: DataTypes.STRING,
            field: 'room_name',
        },
        room_description: {
            type: DataTypes.TEXT,
            field: 'room_description',
        },
        room_category_name: {
            type: DataTypes.STRING,
            field: 'room_category_name',
        },
        join_channel_uuid: {
            type: DataTypes.UUID,
            field: 'join_channel_uuid',
        },
        join_message: {
            type: DataTypes.TEXT,
            field: 'join_message',
        },
        rules_text: {
            type: DataTypes.TEXT,
            field: 'rules_text',
        },
        max_users: {
            type: DataTypes.INTEGER,
            field: 'max_users',
        },
        max_channels: {
            type: DataTypes.INTEGER,
            field: 'max_channels',
        },
        message_days_to_live: {
            type: DataTypes.INTEGER,
            field: 'message_days_to_live',
        },
        total_files_bytes_allowed: {
            type: DataTypes.INTEGER,
            field: 'total_files_bytes_allowed',
        },
        single_file_bytes_allowed: {
            type: DataTypes.INTEGER,
            field: 'single_file_bytes_allowed',
        },
        file_days_to_live: {
            type: DataTypes.INTEGER,
            field: 'file_days_to_live',
        },
        total_files_mb: {
            type: DataTypes.DOUBLE,
            field: 'total_files_mb',
        },
        single_file_mb: {
            type: DataTypes.DOUBLE,
            field: 'single_file_mb',
        },
        bytes_used: {
            type: DataTypes.INTEGER,
            field: 'bytes_used',
        },
        mb_used: {
            type: DataTypes.DOUBLE,
            field: 'mb_used',
        },
        room_avatar_uuid: {
            type: DataTypes.UUID,
            field: 'room_avatar_uuid',
        },
        room_file_uuid: {
            type: DataTypes.TEXT,
            field: 'room_file_uuid',
        },
        room_file_src: {
            type: DataTypes.TEXT,
            field: 'room_file_src',
        },
        room_file_size: {
            type: DataTypes.INTEGER,
            field: 'room_file_size',
        },
        room_file_type_name: {
            type: DataTypes.STRING,
            field: 'room_file_type_name',
        },
        room_file_size_mb: {
            type: DataTypes.DOUBLE,
            field: 'room_file_size_mb',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomView',
        tableName: 'room_view',
        createdAt: 'room_created_at',
        updatedAt: 'room_updated_at',
    });
    return RoomView;
};

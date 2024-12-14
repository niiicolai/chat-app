'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelMessageView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.ChannelMessageView.belongsTo(models.ChannelView, {
                foreignKey: 'channel_uuid',
                targetKey: 'channel_uuid',
            });
        }

        /**
         * @function createChannelMessageProcStatic
         * @description Create a channel message using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.msg
         * @param {string} replacements.channel_message_type_name
         * @param {string} replacements.channel_uuid
         * @param {string} replacements.user_uuid
         * @param {string} replacements.upload_type - optional
         * @param {string} replacements.upload_src - optional
         * @param {number} replacements.bytes - optional
         * @param {string} replacements.room_uuid 
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createChannelMessageProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createChannelMessageProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('createChannelMessageProcStatic: No uuid provided');
            if (!replacements.msg) throw new Error('createChannelMessageProcStatic: No msg provided');
            if (!replacements.channel_message_type_name) throw new Error('createChannelMessageProcStatic: No channel_message_type_name provided');
            if (!replacements.channel_uuid) throw new Error('createChannelMessageProcStatic: No channel_uuid provided');
            if (!replacements.user_uuid) throw new Error('createChannelMessageProcStatic: No user_uuid provided');
            if (!replacements.room_uuid) throw new Error('createChannelMessageProcStatic: No room_uuid provided');
            if (!replacements.upload_type) replacements.upload_type = null;
            if (!replacements.room_file_uuid) replacements.room_file_uuid = null;

            await sequelize.query('CALL create_channel_message_proc(:uuid, :msg, :channel_message_type_name, :channel_uuid, :user_uuid, :upload_type, :room_file_uuid, :room_uuid)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editChannelMessageProc
         * @description Edit a channel message using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.msg
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editChannelMessageProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editChannelMessageProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('editChannelMessageProcStatic: No uuid provided');
            if (!replacements.msg) throw new Error('editChannelMessageProcStatic: No msg provided');

            await sequelize.query('CALL edit_channel_message_proc(:uuid, :msg)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteChannelMessageProcStatic
         * @description Delete a channel message using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteChannelMessageProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteChannelMessageProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteChannelMessageProcStatic: No uuid provided');

            await sequelize.query('CALL delete_channel_message_proc(:uuid)', {
                replacements,
                transaction,
            });
        }

        /**
         * @function editChannelMessageProc
         * @description Edit a channel message using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.msg optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editChannelMessageProc(replacements, transaction) {
            if (!replacements) throw new Error('editChannelMessageProc: No replacements provided');
            if (!replacements.msg) replacements.msg = this.channel_message_body;

            replacements.uuid = this.channel_message_uuid;
            await ChannelMessageView.editChannelMessageProcStatic(replacements, transaction);
        }

        /**
         * @function deleteChannelMessageProc
         * @description Delete a channel message using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteChannelMessageProc(transaction) {
            await ChannelMessageView.deleteChannelMessageProcStatic({ uuid: this.channel_message_uuid }, transaction);
        }
    }
    ChannelMessageView.init({
        channel_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_uuid',
            primaryKey: true,
        },
        channel_message_body: {
            type: DataTypes.TEXT,
            field: 'channel_message_body',
        },
        channel_message_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_type_name',
        },
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
        user_username: {
            type: DataTypes.STRING,
            field: 'user_username',
        },
        user_avatar_src: {
            type: DataTypes.TEXT,
            field: 'user_avatar_src',
        },
        channel_message_upload_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_upload_uuid',
        },
        channel_message_upload_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_upload_type_name',
        },
        room_file_uuid: {
            type: DataTypes.UUID,
            field: 'room_file_uuid',
        },
        room_file_src: {
            type: DataTypes.STRING,
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
        channel_webhook_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_message_uuid',
        },
        channel_webhook_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_uuid',
        },
        channel_webhook_name: {
            type: DataTypes.STRING,
            field: 'channel_webhook_name',
        },
        channel_webhook_room_file_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_room_file_uuid',
        },
        channel_webhook_room_file_src: {
            type: DataTypes.TEXT,
            field: 'channel_webhook_room_file_src',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelMessageView',
        tableName: 'channel_message_view',
        createdAt: 'channel_message_created_at',
        updatedAt: 'channel_message_updated_at',
    });
    return ChannelMessageView;
};

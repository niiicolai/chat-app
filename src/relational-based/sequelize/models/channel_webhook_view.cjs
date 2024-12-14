'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelWebhookView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }

        /**
         * @function createChannelWebhookProc
         * @description Create a channel webhook using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.name
         * @param {string} replacements.description
         * @param {string} replacements.src optional
         * @param {number} replacements.bytes optional
         * @param {string} replacements.room_uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createChannelWebhookProc(replacements, transaction) {
            if (!replacements.uuid) throw new Error('createChannelWebhookProc: No uuid provided');
            if (!replacements.name) throw new Error('createChannelWebhookProc: No name provided');
            if (!replacements.description) throw new Error('createChannelWebhookProc: No description provided');
            if (!replacements.room_file_uuid) replacements.room_file_uuid = null;

            await sequelize.query('CALL create_channel_webhook_proc(:uuid, :channel_uuid, :name, :description, :room_file_uuid)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editChannelWebhookProc
         * @description Edit a channel webhook using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid optional
         * @param {string} replacements.name optional
         * @param {string} replacements.description optional
         * @param {string} replacements.src optional
         * @param {number} replacements.bytes optional
         * @param {string} replacements.room_uuid optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editChannelWebhookProc(replacements, transaction) {
            if (!replacements.uuid) replacements.uuid = this.channel_webhook_uuid;
            if (!replacements.name) replacements.name = this.channel_webhook_name;
            if (!replacements.description) replacements.description = this.channel_webhook_description;
            if (replacements.room_file_uuid === undefined) replacements.room_file_uuid = this.room_file_uuid;

            await sequelize.query('CALL edit_channel_webhook_proc(:uuid, :name, :description, :room_file_uuid)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteChannelWebhookProc
         * @description Delete a channel webhook using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteChannelWebhookProc(transaction) {
            const uuid = this.channel_webhook_uuid;
            if (!uuid) throw new Error('deleteChannelWebhookProc: No uuid provided');

            await sequelize.query('CALL delete_channel_webhook_proc(:uuid)', {
                replacements: { uuid },
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function message
         * @description Create a webhook message using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.message
         * @param {string} replacements.channel_message_uuid
         * @param {string} replacements.channel_webhook_message_type_name
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async createChannelWebhookMessageProc(replacements, transaction) {
            if (!replacements.message) throw new Error('ChannelWebhookView.message: No message provided');
            if (!replacements.channel_message_uuid) throw new Error('ChannelWebhookView.message: No channel_message_uuid provided');
            if (!replacements.channel_webhook_message_type_name) throw new Error('ChannelWebhookView.message: No channel_webhook_message_type_name provided');
            
            replacements.channel_webhook_uuid = this.channel_webhook_uuid;
            replacements.channel_uuid = this.channel_uuid;

            await sequelize.query('CALL create_webhook_message_proc(:channel_message_uuid, :message, :channel_uuid, :channel_webhook_uuid, :channel_webhook_message_type_name)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }
    }
    ChannelWebhookView.init({
        channel_webhook_uuid: {
            type: DataTypes.UUID,
            field: 'channel_webhook_uuid',
            primaryKey: true,
        },
        channel_webhook_name: {
            type: DataTypes.STRING,
            field: 'channel_webhook_name',
        },
        channel_webhook_description: {
            type: DataTypes.TEXT,
            field: 'channel_webhook_description',
        },
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        room_file_uuid: {
            type: DataTypes.UUID,
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
        modelName: 'ChannelWebhookView',
        tableName: 'channel_webhook_view',
        createdAt: 'channel_webhook_created_at',
        updatedAt: 'channel_webhook_updated_at',
    });
    return ChannelWebhookView;
};

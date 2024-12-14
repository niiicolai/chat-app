'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.ChannelView.hasMany(models.ChannelMessageView, {
                foreignKey: 'channel_uuid',
                sourceKey: 'channel_uuid',
            });
        }

        /**
         * @function createChannelProcStatic
         * @description Create a channel using a stored procedure
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.name
         * @param {string} replacements.description
         * @param {string} replacements.channel_type_name
         * @param {string} replacements.room_uuid
         * @param {string} replacements.room_file_uuid - optional
         * @param {Object} transaction - optional
         * @static
         */
        static async createChannelProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('replacements is required');
            if (!replacements.uuid) throw new Error('uuid is required');
            if (!replacements.name) throw new Error('name is required');
            if (!replacements.description) throw new Error('description is required');
            if (!replacements.channel_type_name) throw new Error('channel_type_name is required');
            if (!replacements.room_uuid) throw new Error('room_uuid is required');
            if (!replacements.room_file_uuid) replacements.room_file_uuid = null;
 
            await sequelize.query('CALL create_channel_proc(:uuid, :name, :description, :channel_type_name, :room_uuid, :room_file_uuid)', {
                replacements,
                ...(transaction && { transaction })
            });
        }

        /**
         * @function editChannelProcStatic
         * @description Edit a channel using a stored procedure
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.name
         * @param {string} replacements.description
         * @param {string} replacements.channel_type_name
         * @param {string} replacements.room_uuid
         * @param {string} replacements.room_file_uuid - optional
         * @param {Object} transaction - optional
         * @returns {Promise<void>}
         * @static
         */
        static async editChannelProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('replacements is required');
            if (!replacements.uuid) throw new Error('uuid is required');
            if (!replacements.name) throw new Error('name is required');
            if (!replacements.description) throw new Error('description is required');
            if (!replacements.channel_type_name) throw new Error('channel_type_name is required');
            if (!replacements.room_uuid) throw new Error('room_uuid is required');
            if (!replacements.room_file_uuid) replacements.room_file_uuid = null;

            await sequelize.query('CALL edit_channel_proc(:uuid, :name, :description, :channel_type_name, :room_uuid, :room_file_uuid)', {
                replacements,
                ...(transaction && { transaction })
            });
        }

        /**
         * @function deleteChannelProcStatic
         * @description Delete a channel using a stored procedure
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction - optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteChannelProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteChannelProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteChannelProcStatic: No uuid provided');

            await sequelize.query('CALL delete_channel_proc(:uuid)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editChannelProc
         * @description Edit a channel using a stored procedure
         * @param {Object} replacements
         * @param {string} replacements.name - optional
         * @param {string} replacements.description - optional
         * @param {string} replacements.channel_type_name - optional
         * @param {string} replacements.room_uuid - optional
         * @param {string} replacements.room_file_uuid - optional
         * @param {Object} transaction - optional
         * @returns {Promise<void>}
         * @instance
         */
        async editChannelProc(replacements, transaction) {
            if (!replacements) replacements = {};
            if (!replacements.name) replacements.name = this.channel_name;
            if (!replacements.description) replacements.description = this.channel_description;
            if (!replacements.channel_type_name) replacements.channel_type_name = this.channel_type_name;
            if (!replacements.room_uuid) replacements.room_uuid = this.room_uuid;
            if (!replacements.room_file_uuid) replacements.room_file_uuid = this.room_file_uuid || null;

            replacements.uuid = this.channel_uuid;

            await ChannelView.editChannelProcStatic(replacements, transaction);
        }

        /**
         * @function deleteChannelProc
         * @description Delete a channel using a stored procedure
         * @param {Object} transaction - optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteChannelProc(transaction) {
            await ChannelView.deleteChannelProcStatic({ uuid: this.channel_uuid }, transaction);
        }
    }
    ChannelView.init({
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
            primaryKey: true,
        },
        channel_name: {
            type: DataTypes.STRING,
            field: 'channel_name',
        },
        channel_description: {
            type: DataTypes.STRING,
            field: 'channel_description',
        },
        channel_type_name: {
            type: DataTypes.STRING,
            field: 'channel_type_name',
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
            type: DataTypes.INTEGER,
            field: 'room_file_size_mb',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelView',
        tableName: 'channel_view',
        createdAt: 'channel_created_at',
        updatedAt: 'channel_updated_at',
    });
    return ChannelView;
};

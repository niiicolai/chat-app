'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomFileView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }

        /**
         * @function createRoomFileProcStatic
         * @description Create a room file using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.room_file_uuid
         * @param {string} replacements.room_file_src
         * @param {number} replacements.room_file_size
         * @param {string} replacements.room_uuid
         * @param {string} replacements.room_file_type_name
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createRoomFileProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createRoomFileProcStatic: No replacements provided');
            if (!replacements.room_file_uuid) throw new Error('createRoomFileProcStatic: No room_file_uuid provided');
            if (!replacements.room_file_src) throw new Error('createRoomFileProcStatic: No room_file_src provided');
            if (!replacements.room_file_size) throw new Error('createRoomFileProcStatic: No room_file_size provided');
            if (!replacements.room_uuid) throw new Error('createRoomFileProcStatic: No room_uuid provided');
            if (!replacements.room_file_type_name) throw new Error('createRoomFileProcStatic: No room_file_type_name provided');

            await sequelize.query('CALL create_room_file_proc(:room_file_uuid, :room_file_src, :room_file_size, :room_uuid, :room_file_type_name, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteRoomFileProcStatic
         * @description Delete a room file using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @returns {Promise<void>}
         * @static
         */
        static async deleteRoomFileProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteRoomFileProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteRoomFileProcStatic: No uuid provided');

            await sequelize.query('CALL delete_room_file_proc(:uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteRoomFileProc
         * @description Delete a room file using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.src
         * @param {number} replacements.size
         * @param {string} replacements.room_uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteRoomFileProc(transaction) {
            await RoomFileView.deleteRoomFileProcStatic({ uuid: this.room_file_uuid }, transaction);
        }
    }
    RoomFileView.init({
        room_file_uuid: {
            type: DataTypes.UUID,
            field: 'room_file_uuid',
            primaryKey: true,
        },
        room_file_src: {
            type: DataTypes.TEXT,
            field: 'room_file_src',
        },
        room_file_size: {
            type: DataTypes.INTEGER,
            field: 'room_file_size',
        },
        room_file_size_mb: {
            type: DataTypes.DOUBLE,
            field: 'room_file_size_mb',
        },
        room_file_type_name: {
            type: DataTypes.STRING,
            field: 'room_file_type_name',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
        channel_message_upload_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_upload_uuid',
        },
        channel_message_upload_type_name: {
            type: DataTypes.STRING,
            field: 'channel_message_upload_type_name',
        },
        channel_message_uuid: {
            type: DataTypes.UUID,
            field: 'channel_message_uuid',
        },
        channel_message_body: {
            type: DataTypes.TEXT,
            field: 'channel_message_body',
        },
        user_uuid: {
            type: DataTypes.UUID,
            field: 'user_uuid',
        },
        user_username: {
            type: DataTypes.STRING,
            field: 'user_username',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomFileView',
        tableName: 'room_file_view',
        createdAt: 'room_file_created_at',
        updatedAt: 'room_file_updated_at',
    });
    return RoomFileView;
};

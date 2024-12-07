'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomInviteLinkView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }

        /**
         * @function createRoomInviteLinkProcStatic
         * @description Create a room invite link using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.room_uuid
         * @param {string} replacements.expires_at - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async createRoomInviteLinkProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('createRoomInviteLinkProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('createRoomInviteLinkProcStatic: No uuid provided');
            if (!replacements.room_uuid) throw new Error('createRoomInviteLinkProcStatic: No room_uuid provided');
            if (!replacements.expires_at) replacements.expires_at = null;

            await sequelize.query('CALL create_room_invite_link_proc(:uuid, :room_uuid, :expires_at, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editRoomInviteLinkProc
         * @description Edit a room invite link using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {string} replacements.expires_at - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editRoomInviteLinkProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editRoomInviteLinkProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('editRoomInviteLinkProcStatic: No uuid provided');
            if (!replacements.expires_at) replacements.expires_at = null;

            await sequelize.query('CALL edit_room_invite_link_proc(:uuid, :expires_at, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteRoomInviteLinkProcStatic
         * @description Delete a room invite link using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.uuid
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async deleteRoomInviteLinkProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('deleteRoomInviteLinkProcStatic: No replacements provided');
            if (!replacements.uuid) throw new Error('deleteRoomInviteLinkProcStatic: No uuid provided');

            await sequelize.query('CALL delete_room_invite_link_proc(:uuid, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function editRoomInviteLinkProc
         * @description Edit a room invite link using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.expires_at - optional
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editRoomInviteLinkProc(replacements, transaction) {
            if (!replacements.expires_at) replacements.expires_at = this.room_invite_link_expires_at;
            replacements.uuid = this.room_invite_link_uuid;

            await sequelize.query('CALL edit_room_invite_link_proc(:uuid, :expires_at, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }

        /**
         * @function deleteRoomInviteLinkProc
         * @description Delete a room invite link using a stored procedure.
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async deleteRoomInviteLinkProc(transaction) {
            const uuid = this.room_invite_link_uuid;
            if (!uuid) throw new Error('deleteRoomInviteLinkProc: No uuid provided');

            await sequelize.query('CALL delete_room_invite_link_proc(:uuid, @result)', {
                replacements: { uuid },
                ...(transaction && { transaction }),
            });
        }
    }
    RoomInviteLinkView.init({
        room_invite_link_uuid: {
            type: DataTypes.UUID,
            field: 'room_invite_link_uuid',
            primaryKey: true,
        },
        room_invite_link_expires_at: {
            type: DataTypes.DATE,
            field: 'room_invite_link_expires_at',
        },
        room_invite_link_never_expires: {
            type: DataTypes.BOOLEAN,
            field: 'room_invite_link_never_expires',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomInviteLinkView',
        tableName: 'room_invite_link_view',
        createdAt: 'room_invite_link_created_at',
        updatedAt: 'room_invite_link_updated_at',
    });
    return RoomInviteLinkView;
};

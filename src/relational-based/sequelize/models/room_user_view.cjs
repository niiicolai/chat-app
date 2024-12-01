'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomUserView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.RoomUserView.belongsTo(models.RoomView, {
                foreignKey: 'room_uuid',
                targetKey: 'room_uuid',
            });
        }

        /**
         * @function editRoomUserProcStatic
         * @description Edit a room user using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.user_uuid
         * @param {string} replacements.room_uuid
         * @param {string} replacements.role_name
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @static
         */
        static async editRoomUserProcStatic(replacements, transaction) {
            if (!replacements) throw new Error('editRoomUserProcStatic: No replacements provided');
            if (!replacements.user_uuid) throw new Error('editRoomUserProcStatic: No user_uuid provided');
            if (!replacements.room_uuid) throw new Error('editRoomUserProcStatic: No room_uuid provided');
            if (!replacements.role_name) throw new Error('editRoomUserProcStatic: No role_name provided');

            await sequelize.query('CALL edit_room_user_role_proc(:user_uuid, :room_uuid, :role_name, @result)', {
                replacements,
                ...(transaction && { transaction }),
            });
        }        

        /**
         * @function editRoomUserProc
         * @description Edit a room user using a stored procedure.
         * @param {Object} replacements
         * @param {string} replacements.role_name
         * @param {Object} transaction optional
         * @returns {Promise<void>}
         * @instance
         */
        async editRoomUserProc(replacements, transaction) {
            if (!replacements.role_name) replacements.role_name = this.room_user_role_name;
            replacements.user_uuid = this.user_uuid;
            replacements.room_uuid = this.room_uuid;

            await RoomUserView.editRoomUserProcStatic(replacements, transaction);
        }
    }
    RoomUserView.init({
        room_user_uuid: {
            type: DataTypes.UUID,
            field: 'room_user_uuid',
            primaryKey: true,
        },
        room_user_role_name: {
            type: DataTypes.STRING,
            field: 'room_user_role_name',
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
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomUserView',
        tableName: 'room_user_view',
        createdAt: 'room_user_created_at',
        updatedAt: 'room_user_updated_at',
    });
    return RoomUserView;
};

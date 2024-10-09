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

'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomAuditView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomAuditView.init({
        room_audit_uuid: {
            type: DataTypes.UUID,
            field: 'room_audit_uuid',
            primaryKey: true,
        },
        room_audit_body: {
            type: DataTypes.TEXT,
            field: 'room_audit_body',
        },
        room_audit_type_name: {
            type: DataTypes.STRING,
            field: 'room_audit_type_name',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomAuditView',
        tableName: 'room_audit_view',
        createdAt: 'room_audit_created_at',
        updatedAt: 'room_audit_updated_at',
    });
    return RoomAuditView;
};

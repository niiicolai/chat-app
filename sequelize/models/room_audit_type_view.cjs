'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomAuditTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomAuditTypeView.init({
        room_audit_type_name: {
            type: DataTypes.STRING,
            field: 'room_audit_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomAuditTypeView',
        tableName: 'room_audit_type_view',
        createdAt: 'room_audit_type_created_at',
        updatedAt: 'room_audit_type_updated_at',
    });
    return RoomAuditTypeView;
};

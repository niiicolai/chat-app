'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelAuditView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelAuditView.init({
        channel_audit_uuid: {
            type: DataTypes.UUID,
            field: 'channel_audit_uuid',
            primaryKey: true,
        },
        channel_audit_body: {
            type: DataTypes.TEXT,
            field: 'channel_audit_body',
        },
        channel_audit_type_name: {
            type: DataTypes.STRING,
            field: 'channel_audit_type_name',
        },
        channel_uuid: {
            type: DataTypes.UUID,
            field: 'channel_uuid',
        },
        room_uuid: {
            type: DataTypes.UUID,
            field: 'room_uuid',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelAuditView',
        tableName: 'channel_audit_view',
        createdAt: 'channel_audit_created_at',
        updatedAt: 'channel_audit_updated_at',
    });
    return ChannelAuditView;
};

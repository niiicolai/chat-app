'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChannelAuditTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ChannelAuditTypeView.init({
        channel_audit_type_name: {
            type: DataTypes.STRING,
            field: 'channel_audit_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'ChannelAuditTypeView',
        tableName: 'channel_audit_type_view',
        createdAt: 'channel_audit_type_created_at',
        updatedAt: 'channel_audit_type_updated_at',
    });
    return ChannelAuditTypeView;
};

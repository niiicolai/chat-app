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

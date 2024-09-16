'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomFileTypeView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomFileTypeView.init({
        room_file_type_name: {
            type: DataTypes.STRING,
            field: 'room_file_type_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomFileTypeView',
        tableName: 'room_file_type_view',
        createdAt: 'room_file_type_created_at',
        updatedAt: 'room_file_type_updated_at',
    });
    return RoomFileTypeView;
};

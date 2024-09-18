'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RoomCategoryView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    RoomCategoryView.init({
        room_category_name: {
            type: DataTypes.STRING,
            field: 'room_category_name',
            primaryKey: true,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'RoomCategoryView',
        tableName: 'room_category_view',
        createdAt: 'room_category_created_at',
        updatedAt: 'room_category_updated_at',
    });
    return RoomCategoryView;
};

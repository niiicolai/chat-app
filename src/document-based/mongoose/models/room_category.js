import mongoose from "mongoose";

const roomCategorySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});

const roomCategoryModel = mongoose.model("RoomCategory", roomCategorySchema);

export default roomCategoryModel;

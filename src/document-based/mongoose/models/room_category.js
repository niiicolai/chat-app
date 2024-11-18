import mongoose from "mongoose";

export const roomCategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});

const roomCategoryModel = mongoose.model("RoomCategory", roomCategorySchema);

export default roomCategoryModel;

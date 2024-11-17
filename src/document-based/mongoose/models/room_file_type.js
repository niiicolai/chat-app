import mongoose from "mongoose";

export const roomFileTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const roomFileTypeModel = mongoose.model("RoomFileType", roomFileTypeSchema);

export default roomFileTypeModel;

import mongoose from "mongoose";

const roomFileTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const roomFileTypeModel = mongoose.model("RoomFileType", roomFileTypeSchema);

export default roomFileTypeModel;

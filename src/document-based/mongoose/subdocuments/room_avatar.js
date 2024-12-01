import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    room_file: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'RoomFile', 
        required: false 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

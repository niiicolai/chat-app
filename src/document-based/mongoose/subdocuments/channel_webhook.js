import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    name: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
    description: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
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

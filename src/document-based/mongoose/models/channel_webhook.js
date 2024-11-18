import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    room_file: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'RoomFile', 
        required: false 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

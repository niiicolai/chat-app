import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    join_channel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel', 
        required: false 
    },
    join_message: { 
        type: String, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

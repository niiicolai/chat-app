import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    max_channels: { 
        type: Number, 
        required: true 
    },
    message_days_to_live: { 
        type: Number, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

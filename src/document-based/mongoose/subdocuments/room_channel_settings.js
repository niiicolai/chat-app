import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    max_channels: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
    message_days_to_live: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

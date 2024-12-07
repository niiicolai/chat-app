import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    join_channel: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'Channel', 
        required: false 
    },
    join_message: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

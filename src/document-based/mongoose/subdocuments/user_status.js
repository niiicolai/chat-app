import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    last_seen_at: { 
        type: mongoose.Schema.Types.Date, 
        required: true 
    },
    message: { 
        type: mongoose.Schema.Types.String,
        required: true 
    },
    total_online_hours: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
    user_status_state: {
        type: mongoose.Schema.Types.String, 
        ref: 'UserStatusState',
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

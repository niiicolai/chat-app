import mongoose from "mongoose";

import { userStatusStateSchema as user_status_state } from "./user_status_state.js";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    last_seen_at: { 
        type: Date, 
        required: true 
    },
    message: { 
        type: String,
        required: true 
    },
    total_online_hours: { 
        type: Number, 
        required: true 
    },
    user_status_state,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

import mongoose from "mongoose";

import { roomUserRoleSchema as room_user_role } from "./room_user_role.js";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    room_user_role,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

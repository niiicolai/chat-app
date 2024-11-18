import mongoose from "mongoose";

import { userLoginTypeSchema as user_login_type } from "./user_login_type.js";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    password: { 
        type: String, 
        required: false 
    },
    third_party_id: { 
        type: String, 
        required: false 
    },
    user_login_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

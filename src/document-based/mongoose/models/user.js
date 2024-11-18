import mongoose from "mongoose";

import user_login from "./user_login.js";
import user_password_reset from "./user_password_reset.js";
import user_email_verification from "./user_email_verification.js";
import user_status from "./user_status.js";

export default mongoose.model("User", new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    avatar_src: { 
        type: String, 
        required: false 
    },
    user_password_resets: [user_password_reset],
    user_logins: [user_login],
    user_email_verification,
    user_status,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));

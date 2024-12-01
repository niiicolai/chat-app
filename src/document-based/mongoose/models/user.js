import mongoose from "mongoose";

import user_login from "../subdocuments/user_login.js";
import user_password_reset from "../subdocuments/user_password_reset.js";
import user_email_verification from "../subdocuments/user_email_verification.js";
import user_status from "../subdocuments/user_status.js";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    username: { 
        type: mongoose.Schema.Types.String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: mongoose.Schema.Types.String, 
        required: true, 
        unique: true 
    },
    avatar_src: { 
        type: mongoose.Schema.Types.String, 
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
    },
    _id: false
});

export default mongoose.model("User", userSchema);

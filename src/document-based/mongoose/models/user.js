import mongoose from "mongoose";

// Import schemas for subdocuments
import user_login from "./user_login.js";
import user_password_reset from "./user_password_reset.js";
import user_email_verification from "./user_email_verification.js";
import user_status from "./user_status.js";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
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
    },
    _id: false
});

export default mongoose.model("User", userSchema);



import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    user: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'User', 
        required: true 
    },
    room_user_role: { 
        type: mongoose.Schema.Types.String, 
        ref: 'RoomUserRole',
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    room_file: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'RoomFile', 
        required: true 
    },
    channel_message_upload_type: {
        type: mongoose.Schema.Types.String,
        ref: 'ChannelMessageUploadType',
        required: true
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

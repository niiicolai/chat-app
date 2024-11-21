import mongoose from "mongoose";

import { channelTypeSchema as channel_type } from "./channel_type.js";
import channel_webhook from "./channel_webhook.js";
import ChannelAudit from "./channel_audit.js";
import { v4 as uuidv4 } from 'uuid';

const channelSchema = new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true 
    },
    room_file: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'RoomFile', 
        required: false 
    },
    channel_type,
    channel_webhook: {
        type: channel_webhook,
        required: false
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

channelSchema.post('save', async (doc) => {
    const isNew = doc.created_at === doc.updated_at;
    await ChannelAudit.create({
        uuid: uuidv4(),
        body: doc,
        channel: doc._id,
        channel_audit_type: (isNew ? 'CHANNEL_CREATED' : 'CHANNEL_EDITED'),
    });
});

channelSchema.post('remove', async (doc) => {
    await ChannelAudit.create({
        uuid: uuidv4(),
        body: doc,
        channel: doc._id,
        channel_audit_type: 'CHANNEL_DELETED',
    });
});

export default mongoose.model("Channel", channelSchema);

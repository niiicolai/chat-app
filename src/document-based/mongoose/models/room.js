import mongoose from "mongoose";

import room_join_settings from "../subdocuments/room_join_settings.js";
import room_file_settings from "../subdocuments/room_file_settings.js";
import room_user_settings from "../subdocuments/room_user_settings.js";
import room_channel_settings from "../subdocuments/room_channel_settings.js";
import room_rules_settings from "../subdocuments/room_rules_settings.js";
import room_avatar from "../subdocuments/room_avatar.js";
import room_user from "../subdocuments/room_user.js";
import room_invite_link from "../subdocuments/room_invite_link.js";
import RoomAudit from "./room_audit.js";
import { v4 as uuidv4 } from 'uuid';

const roomSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    name: { 
        type: mongoose.Schema.Types.String, 
        required: true,
        unique: true 
    },
    description: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
    room_category: { 
        type: mongoose.Schema.Types.String, 
        ref: 'RoomCategory',
        required: true 
    },
    room_join_settings,
    room_file_settings,
    room_user_settings,
    room_channel_settings,
    room_rules_settings,
    room_avatar,
    room_users: [room_user],
    room_invite_links: [room_invite_link],
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    autoCreate: false
});

roomSchema.post('save', async (doc) => {
    const isNew = doc.created_at === doc.updated_at;
    await RoomAudit.create({
        uuid: uuidv4(),
        body: doc,
        room: doc._id,
        room_audit_type: (isNew ? 'ROOM_CREATED' : 'ROOM_EDITED'),
    });
});

roomSchema.post('remove', async (doc) => {
    await RoomAudit.create({
        uuid: uuidv4(),
        body: doc,
        room: doc._id,
        room_audit_type: 'ROOM_DELETED',
    });
});

const roomModel = mongoose.model("Room", roomSchema);

export default roomModel;

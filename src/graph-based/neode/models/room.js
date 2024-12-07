export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    name: {
        type: 'string',
        required: false
    },
    description: {
        type: 'string',
        required: true
    },
    created_at: {
        type: 'datetime',
        required: true,
        default: () => new Date().toISOString()
    },
    updated_at: {
        type: 'datetime',
        required: true,
        default: () => new Date().toISOString()
    },
    /**
     * OUTGOING RELATION
     */
    channels: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'COMMUNICATES_IN',
        direction: 'out',
    },
    room_category: {
        type: 'relationship',
        target: 'RoomCategory',
        relationship: 'CATEGORY_IS',
        direction: 'out',
        eager: true
    },
    room_join_settings: {
        type: 'relationship',
        target: 'RoomJoinSettings',
        relationship: 'JOIN_SETTINGS_IS',
        direction: 'out',
        eager: true
    },
    room_file_settings: {
        type: 'relationship',
        target: 'RoomFileSettings',
        relationship: 'FILE_SETTINGS_IS',
        direction: 'out',
        eager: true
    },
    room_user_settings: {
        type: 'relationship',
        target: 'RoomUserSettings',
        relationship: 'USER_SETTINGS_IS',
        direction: 'out',
        eager: true
    },
    room_channel_settings: {
        type: 'relationship',
        target: 'RoomChannelSettings',
        relationship: 'CHANNEL_SETTINGS_IS',
        direction: 'out',
        eager: true
    },
    room_rules_settings: {
        type: 'relationship',
        target: 'RoomRulesSettings',
        relationship: 'RULES_SETTINGS_IS',
        direction: 'out',
        eager: true
    },
    room_avatar: {
        type: 'relationship',
        target: 'RoomAvatar',
        relationship: 'ROOM_AVATAR_IS',
        direction: 'out',
        eager: true
    },
    room_invite_link: {
        type: 'relationship',
        target: 'RoomInviteLink',
        relationship: 'INVITES_VIA',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'STORED_IN',
        direction: 'in'
    },
    room_audit: {
        type: 'relationship',
        target: 'RoomAudit',
        relationship: 'AUDIT_BY',
        direction: 'in',
    },
}

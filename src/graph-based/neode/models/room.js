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
    room_category: {
        type: 'relationship',
        target: 'RoomCategory',
        relationship: 'HAS_CATEGORY',
        direction: 'out',
        eager: true
    },
    room_join_settings: {
        type: 'relationship',
        target: 'RoomJoinSettings',
        relationship: 'HAS_JOIN_SETTINGS',
        direction: 'out',
        eager: true
    },
    room_file_settings: {
        type: 'relationship',
        target: 'RoomFileSettings',
        relationship: 'HAS_FILE_SETTINGS',
        direction: 'out',
        eager: true
    },
    room_user_settings: {
        type: 'relationship',
        target: 'RoomUserSettings',
        relationship: 'HAS_USER_SETTINGS',
        direction: 'out',
        eager: true
    },
    room_channel_settings: {
        type: 'relationship',
        target: 'RoomChannelSettings',
        relationship: 'HAS_CHANNEL_SETTINGS',
        direction: 'out',
        eager: true
    },
    room_rules_settings: {
        type: 'relationship',
        target: 'RoomRulesSettings',
        relationship: 'HAS_RULES_SETTINGS',
        direction: 'out',
        eager: true
    },
    room_avatar: {
        type: 'relationship',
        target: 'RoomAvatar',
        relationship: 'HAS_ROOM_AVATAR',
        direction: 'in',
        eager: true
    },
    room_files: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'HAS_ROOM_FILE',
        direction: 'in',
        eager: true
    },
    room_invite_links: {
        type: 'relationship',
        target: 'RoomInviteLink',
        relationship: 'HAS_INVITE_LINK',
        direction: 'in',
        eager: true
    },
    room_users: {
        type: 'relationship',
        target: 'User',
        relationship: 'HAS_USER',
        direction: 'in',
        eager: true
    },
    room_audits: {
        type: 'relationship',
        target: 'RoomAudit',
        relationship: 'HAS_AUDIT',
        direction: 'in',
    },
    channels: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'HAS_CHANNEL',
        direction: 'in',
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
}

export default {
    users: [
        {
            uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
            username: "admin",
            email: "admin@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
        },
        {
            uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
            username: "moderator",
            email: "moderator@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/LemonadeGuyCardboardAndPencilWithShadow-8cdc3130cc5498718fce7ee9d1ff5d92ddcc2ed81c689a1bf275bd14189a607c-512.jpg",
        },
        {
            uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
            username: "member",
            email: "member@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/mobile-park-character-animating.png",
        }
    ],
    user_login: {
        password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa'
    },
    user_login_types: [
        { name: 'Password' },
        { name: 'Google' },
    ],
    user_status_states: [
        { name: 'Online' },
        { name: 'Away' },
        { name: 'Do Not Disturb' },
        { name: 'Offline' },
    ],
    room_user_roles: [
        { name: 'Admin' },
        { name: 'Moderator' },
        { name: 'Member' },
    ],
    room_file_types: [
        { name: 'ChannelWebhookAvatar' },
        { name: 'ChannelMessageUpload' },
        { name: 'ChannelAvatar' },
        { name: 'RoomAvatar' },
    ],
    room_categories: [
        { name: 'General' },
        { name: 'Tech' },
        { name: 'Sports' },
        { name: 'Music' },
        { name: 'Movies' },
        { name: 'Books' },
        { name: 'Gaming' },
        { name: 'Food' },
        { name: 'Travel' },
        { name: 'Fitness' },
        { name: 'Fashion' },
        { name: 'Art' },
        { name: 'Science' },
        { name: 'Politics' },
        { name: 'Business' },
        { name: 'Education' },
        { name: 'Health' },
        { name: 'Lifestyle' },
        { name: 'Entertainment' },
        { name: 'Other' },
    ],
    room_audit_types: [
        { name: 'ROOM_CREATED' },
        { name: 'ROOM_EDITED' },
        { name: 'ROOM_DELETED' },
        { name: 'JOIN_SETTING_EDITED' },
        { name: 'INVITE_LINK_CREATED' },
        { name: 'INVITE_LINK_EDITED' },
        { name: 'INVITE_LINK_DELETED' },
        { name: 'USER_ADDED' },
        { name: 'USER_REMOVED' },
        { name: 'FILE_CREATED' },
        { name: 'FILE_DELETED' },
        { name: 'AVATAR_CREATED' },
        { name: 'AVATAR_EDITED' },
        { name: 'AVATAR_DELETED' },
        { name: 'CHANNEL_CREATED' },
        { name: 'CHANNEL_EDITED' },
        { name: 'CHANNEL_DELETED' },
    ],
    channel_webhook_message_types: [
        { name: 'Custom' },
        { name: 'GitHub' },
    ],
    channel_types: [
        { name: 'Text' },
        { name: 'Call' },
    ],
    channel_message_upload_types: [
        { name: 'Image' },
        { name: 'Video' },
        { name: 'Document' },
    ],
    channel_message_types: [
        { name: 'User' },
        { name: 'System' },
        { name: 'Webhook' },
    ],
    channel_audit_types: [
        { name: 'MESSAGE_CREATED' },
        { name: 'MESSAGE_EDITED' },
        { name: 'MESSAGE_DELETED' },
        { name: 'WEBHOOK_CREATED' },
        { name: 'WEBHOOK_EDITED' },
        { name: 'WEBHOOK_DELETED' },
    ],
    room: {
        uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
        name: "General",
        description: "General discussion",

        room_user_settings: {
            uuid: "986f3733-7bbd-4744-8ce2-ad11ddd95462",
        },
        room_channel_settings: {
            uuid: "c08d0b09-698f-46d5-8903-dc1236bf0b95",
        },
        room_rules_settings: {
            uuid: "1d9ace5f-b43a-46d4-aa61-2671fe5ced52",
        },
        room_file_settings: {
            uuid: "dafd92a0-9319-442f-93d8-1a601d65a00c",
        },
        room_join_settings: {
            uuid: "c23d7a4e-b515-49e7-a754-64c57152607c",
        },
        room_avatar: {
            uuid: "58158a72-9d4e-4454-8ddc-ab1d5e0a7720",
        },
        room_invite_link: {
            uuid: "0bd06de6-b6df-4abe-8385-5e57cdb13649",
        },
        room_users: [
            { uuid: "5b0d4bbc-a1dd-4cd9-aeee-aecf63083693" },
            { uuid: "b0246111-5172-44df-9f36-22f7d18826a5" },
            { uuid: "2a2a430a-016e-4c06-bc48-0ee2b8b176d8" },
        ],
        room_avatar_file: {
            uuid: "5c18ae8b-40c1-49dc-ba42-544f87520cf5",
            src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            size: 1024,
        },
    }
};

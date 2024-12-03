import { v4 as uuidv4 } from 'uuid';

export default {
    users: [
        {
            uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
            username: "admin",
            email: "admin@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            user_status: {
                uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                last_seen_at: "2021-09-01T00:00:00.000Z",
                message: "I'm back!",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_email_verification: {
                uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                is_verified: true
            },
            user_logins: [{
                uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                user_login_type: "Password",
                password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa'
            }],
            user_password_resets: [{
                uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                expires_at: new Date()
            }]
        },
        {
            uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
            username: "moderator",
            email: "moderator@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/LemonadeGuyCardboardAndPencilWithShadow-8cdc3130cc5498718fce7ee9d1ff5d92ddcc2ed81c689a1bf275bd14189a607c-512.jpg",
            user_status: {
                uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                last_seen_at: "2021-09-01T00:00:00.000Z",
                message: "I'm back!",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_email_verification: {
                uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                is_verified: true
            },
            user_logins: [{
                uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                user_login_type: "Password",
                password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa'
            }],
            user_password_resets: [{
                uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                expires_at: new Date()
            }]
        },
        {
            uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
            username: "member",
            email: "member@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/mobile-park-character-animating.png",
            user_status: {
                uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                last_seen_at: "2021-09-01T00:00:00.000Z",
                message: "I'm back!",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_email_verification: {
                uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                is_verified: true
            },
            user_logins: [{
                uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                user_login_type: "Password",
                password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa'
            }],
            user_password_resets: [{
                uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                expires_at: new Date()
            }]
        },
        {
            uuid: "b2dfbca9-89d3-417d-9535-753dd6e10006",
            username: "not_in_a_room",
            email: "not_in_a_room@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/mobile-park-character-animating.png",
            user_status: {
                uuid: "1ab0c5d7-5be0-449c-a033-9aa41d44d640",
                last_seen_at: "2021-09-01T00:00:00.000Z",
                message: "I'm back!",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_email_verification: {
                uuid: "e7027926-9982-435f-af97-6837315b5a84",
                is_verified: true
            },
            user_logins: [{
                uuid: "92fd846f-0fb0-407c-9040-bee43f82d18d",
                user_login_type: "Password",
                password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa'
            }],
            user_password_resets: [{
                uuid: "2f62ad11-3a4a-4e40-a2e3-36be4af473bf",
                expires_at: new Date()
            }]
        },
        {
            uuid: "a3aa712a-628f-44c1-8b5a-3c915cd6e2f2",
            username: "pass_reset_user",
            email: "pass_reset_user@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/mobile-park-character-animating.png",
            user_status: {
                uuid: "5c11a8e7-bd52-4482-8d01-4bb06a29cb07",
                last_seen_at: "2021-09-01T00:00:00.000Z",
                message: "I'm back!",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_email_verification: {
                uuid: "443e97d6-8d27-4828-9ea8-56e155b55642",
                is_verified: true
            },
            user_logins: [{
                uuid: "5fefce76-a6fc-4290-953a-14d600ad012d",
                user_login_type: "Password",
                password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa'
            }],
            user_password_resets: [{
                uuid: "b1004b90-74a5-491a-bedb-76d292ede901",
                expires_at: new Date()
            }]
        },
    ],
    rooms: [
        {
            uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
            name: 'General Chat',
            description: 'A room for general discussion',
            room_category_name: 'General',
            room_join_settings: {
                uuid: "c23d7a4e-b515-49e7-a754-64c57152607c",
                join_message: 'Welcome to the room!',
            },
            room_file_settings: {
                uuid: "dafd92a0-9319-442f-93d8-1a601d65a00c",
                file_days_to_live: 30,
                total_files_bytes_allowed: 100000000,
                single_file_bytes_allowed: 5000000,
            },
            room_user_settings: {
                uuid: "986f3733-7bbd-4744-8ce2-ad11ddd95462",
                max_users: 25,
            },
            room_channel_settings: {
                uuid: "c08d0b09-698f-46d5-8903-dc1236bf0b95",
                max_channels: 5,
                message_days_to_live: 30,
            },
            room_rules_settings: {
                uuid: "1d9ace5f-b43a-46d4-aa61-2671fe5ced52",
                rules_text: '# Rules\n 1. No Spamming!',
            },
            room_avatar: {
                uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                room_file_uuid: "1d9ace5f-b43a-46d4-aa61-2671fe5ced52"
            },
            room_invite_link: {
                uuid: "0bd06de6-b6df-4abe-8385-5e57cdb13649",
            },
            room_users: [
                {
                    uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                    room_user_role_name: 'Admin',
                    user_uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                },
                {
                    uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                    room_user_role_name: 'Moderator',
                    user_uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                },
                {
                    uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                    room_user_role_name: 'Member',
                    user_uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                }
            ],
            room_files: [
                {
                    uuid: "1d9ace5f-b43a-46d4-aa61-2671fe5ced52",
                    src: 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/room-avatar.jpg',
                    size: 1000000,
                    room_file_type_name: 'RoomAvatar',
                },
                {
                    uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
                    src: 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/room-avatar.jpg',
                    size: 1000000,
                    room_file_type_name: 'ChannelMessageUpload',
                },
            ],
            channels: [
                {
                    uuid: "1c9437b0-4e88-4a8e-84f0-679c7714407f",
                    name: "General Discussion",
                    description: "General discussion channel",
                    channel_type_name: "Text",
                    channel_webhook: {
                        uuid: "1c9437b0-4e88-4a8e-84f0-679c7714407f",
                        name: "Test Channel Webhook",
                        description: "Test Channel Webhook Description",
                    },
                    channel_messages: [
                        {
                            uuid: "1c9437b0-4e88-4a8e-84f0-679c7714407f",
                            body: "Test Channel Message 1",
                            channel_message_type_name: "User",
                            user_uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                            channel_message_upload: {
                                uuid: "1c9437b0-4e88-4a8e-84f0-679c7714407f",
                                room_file_uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
                                channel_message_upload_type_name: "Image"
                            }
                        },
                        {
                            uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
                            body: "Test Channel Message 2",
                            channel_message_type_name: "Webhook",
                            channel_webhook_message: {
                                uuid: "1c9437b0-4e88-4a8e-84f0-679c7714407f",
                                body: "Test Channel Message 2e",
                                channel_webhook_message_type_name: "Custom",
                            }
                        },
                    ]
                },
                {
                    uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
                    name: "Call",
                    description: "General call channel",
                    channel_type_name: "Call",
                    channel_webhook: null,
                    channel_messages: []
                },
            ],
            room_audits: [
                {
                    uuid: "58b00196-088a-4368-a2ef-a32e3ee54200",
                    body: "some data here",
                    room_audit_type_name: "ROOM_CREATED",
                    room_uuid: "a595b5cb-7e47-4ce7-9875-cdf99184a73c",
                }
            ],
            channel_audits: [
                {
                    uuid: "3a99fc75-9cad-49ef-996d-2e1c7c7e79c5",
                    body: "some data here",
                    channel_audit_type_name: "CHANNEL_CREATED",
                    channel_uuid: "1c9437b0-4e88-4a8e-84f0-679c7714407f",
                }
            ]
        },
        {
            uuid: "b2ceef0b-df49-4d69-bdfb-683d967ec2d6",
            name: 'General Chat2',
            description: 'A room for general discussion2',
            room_category_name: 'General',
            room_join_settings: {
                uuid: "c22d7a4e-b515-49e7-a754-64c57152607c",
                join_message: 'Welcome to the room!',
            },
            room_file_settings: {
                uuid: "dafd91a0-9319-442f-93d8-1a601d65a00c",
                file_days_to_live: 30,
                total_files_bytes_allowed: 100000000,
                single_file_bytes_allowed: 5000000,
            },
            room_user_settings: {
                uuid: "986f1733-7bbd-4744-8ce2-ad11ddd95462",
                max_users: 25,
            },
            room_channel_settings: {
                uuid: "c08d1b09-698f-46d5-8903-dc1236bf0b95",
                max_channels: 5,
                message_days_to_live: 30,
            },
            room_rules_settings: {
                uuid: "1d2ace5f-b43a-46d4-aa61-2671fe5ced52",
                rules_text: '# Rules\n 1. No Spamming!',
            },
            room_avatar: {
                uuid: "dd3db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
            },
            room_invite_link: {
                uuid: "0bd16de6-b6df-4abe-8385-5e57cdb13649",
            },
            room_users: [
                {
                    uuid: "d5a2831c-88e5-4713-ae0c-c4e86c2f4209",
                    room_user_role_name: 'Admin',
                    user_uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                },
                {
                    uuid: "cdcf369f-57de-4cb3-98d6-36c7cd7141d6",
                    room_user_role_name: 'Moderator',
                    user_uuid: "cdcf569f-57de-4cb3-98d6-36c7cd7141d6",
                },
                {
                    uuid: "dd1db481-0b0a-4b2c-b0e1-0b5d569e6f9b",
                    room_user_role_name: 'Member',
                    user_uuid: "dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b",
                }
            ],
            room_files: [],
            channels: [
                {
                    uuid: "1c9337b0-4e88-4a8e-84f0-679c7714407f",
                    name: "General Discussion",
                    description: "General discussion channel",
                    channel_type_name: "Text",
                    channel_webhook: {
                        uuid: "1c9237b0-4e88-4a8e-84f0-679c7714407f",
                        name: "Test Channel Webhook",
                        description: "Test Channel Webhook Description",
                    },
                    channel_messages: [
                        {
                            uuid: "1c9237b0-4e88-4a8e-84f0-679c7714407f",
                            body: "Test Channel Message 1",
                            channel_message_type_name: "User",
                            user_uuid: "d5a0831c-88e5-4713-ae0c-c4e86c2f4209",
                        },
                        {
                            uuid: "a592b5cb-7e47-4ce7-9875-cdf99184a73c",
                            body: "Test Channel Message 2",
                            channel_message_type_name: "Webhook",
                            channel_webhook_message: {
                                uuid: "1c9427b0-4e88-4a8e-84f0-679c7714407f",
                                body: "Test Channel Message 2e",
                                channel_webhook_message_type_name: "Custom",
                            }
                        },
                    ]
                },
                {
                    uuid: "a595b2cb-7e47-4ce7-9875-cdf99184a73c",
                    name: "Call",
                    description: "General call channel",
                    channel_type_name: "Call",
                    channel_webhook: null,
                    channel_messages: []
                },
            ],
            room_audits: [
                {
                    uuid: "b0767d44-cbcf-49f7-9757-fb83da608aa7",
                    body: "some data here",
                    room_audit_type_name: "ROOM_CREATED",
                    room_uuid: "b2ceef0b-df49-4d69-bdfb-683d967ec2d6",
                }
            ],
            channel_audits: [
                {
                    uuid: "1ab9b4ec-99f3-431d-a970-96d87b483cbb",
                    body: "some data here",
                    channel_audit_type_name: "CHANNEL_CREATED",
                    channel_uuid: "1c9337b0-4e88-4a8e-84f0-679c7714407f",
                }
            ]
        },
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
        { name: 'CHANNEL_CREATED' },
        { name: 'CHANNEL_EDITED' },
        { name: 'CHANNEL_DELETED' },
        { name: 'MESSAGE_CREATED' },
        { name: 'MESSAGE_EDITED' },
        { name: 'MESSAGE_DELETED' },
        { name: 'WEBHOOK_CREATED' },
        { name: 'WEBHOOK_EDITED' },
        { name: 'WEBHOOK_DELETED' },
    ],
    user_login_types: [
        { name: 'Password' },
        { name: 'Google' },
    ],
    user_login: {
        password: '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa',
        user_login_type_name: 'Password',
    },
};

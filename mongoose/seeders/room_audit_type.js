import RoomAuditType from '../models/room_audit_type.js';

const data = [
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
];

export default class RoomAuditTypeSeeder {
    async up() {
        await RoomAuditType.insertMany(data);
    }

    async down() {
        await RoomAuditType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}

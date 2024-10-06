import ChannelAuditType from '../models/channel_audit_type.js';

const data = [
    { name: 'MESSAGE_CREATED' },
    { name: 'MESSAGE_EDITED' },
    { name: 'MESSAGE_DELETED' },
    { name: 'WEBHOOK_CREATED' },
    { name: 'WEBHOOK_EDITED' },
    { name: 'WEBHOOK_DELETED' },
];

export default class ChannelAuditTypeSeeder {
    async up() {
        await ChannelAuditType.insertMany(data);
    }

    async down() {
        await ChannelAuditType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}

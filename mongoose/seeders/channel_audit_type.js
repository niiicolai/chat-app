import ChannelAuditType from '../models/channel_audit_type.js';
import data from './data.js';

export default class ChannelAuditTypeSeeder {
    async up() {
        await ChannelAuditType.insertMany(data.channel_audit_types);
    }

    async down() {
        await ChannelAuditType.deleteMany({ name: { $in: data.channel_audit_types.map((d) => d.name) } });
    }
}

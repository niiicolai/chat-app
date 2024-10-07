import ChannelAudit from '../models/channel_audit.js';
import data from './data.js';

export default class ChannelAuditSeeder {
    async up() {
        await ChannelAudit.insertMany(data.channel_audits);
    }

    async down() {
        await ChannelAudit.deleteMany({ uuid: { $in: data.channel_audits.map((d) => d.uuid) } });
    }
}

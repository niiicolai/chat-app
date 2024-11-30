import ChannelAuditType from '../models/channel_audit_type.js';
import data from '../../../seed_data.js';

export default class ChannelAuditTypeSeeder {
    async up() {
        await ChannelAuditType.insertMany(data.channel_audit_types);
    }

    async down() {
        if (await ChannelAuditType.exists()) {
            await ChannelAuditType.collection.drop();
        }
    }
}

import data from "./data.js";

export default class ChannelAuditTypeSeeder {
    async up(neodeInstance) {
        for (let state of data.channel_audit_types) {
            neodeInstance.model('ChannelAuditType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.channel_audit_types) {
            const savedState = await neodeInstance.model('ChannelAuditType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}

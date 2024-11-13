import data from "./data.js";

export default class RoomAuditTypeSeeder {
    async up(neodeInstance) {
        for (let state of data.room_audit_types) {
            neodeInstance.model('RoomAuditType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.room_audit_types) {
            const savedState = await neodeInstance.model('RoomAuditType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}

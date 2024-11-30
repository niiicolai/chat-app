import data from '../../../seed_data.js';

export default class RoomUserRoleSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        for (let state of data.room_user_roles) {
            neodeInstance.model('RoomUserRole').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.room_user_roles) {
            const savedState = await neodeInstance.model('RoomUserRole').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}

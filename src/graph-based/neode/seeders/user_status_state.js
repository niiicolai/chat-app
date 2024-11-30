import data from '../../../seed_data.js';

export default class UserStatusStateSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        for (let state of data.user_status_states) {
            neodeInstance.model('UserStatusState').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.user_status_states) {
            const savedState = await neodeInstance.model('UserStatusState').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}

import data from '../../../seed_data.js';

export default class UserLoginTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        for (let state of data.user_login_types) {
            await neodeInstance.model('UserLoginType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.user_login_types) {
            const savedState = await neodeInstance.model('UserLoginType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}

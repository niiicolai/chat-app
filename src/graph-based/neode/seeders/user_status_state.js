import data from '../../../seed_data.js';

export default class UserStatusStateSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.user_status_states.map(async (state) => {
            return neodeInstance.model('UserStatusState').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:UserStatusState) DETACH DELETE n');
    }
}

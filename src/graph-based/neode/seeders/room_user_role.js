import data from '../../../seed_data.js';

export default class RoomUserRoleSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.room_user_roles.map(async (state) => {
            return neodeInstance.model('RoomUserRole').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:RoomUserRole) DETACH DELETE n');
    }
}

import data from '../../../seed_data.js';

export default class RoomCategorySeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.room_categories.map(async (state) => {
            return neodeInstance.model('RoomCategory').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:RoomCategory) DETACH DELETE n');
    }
}

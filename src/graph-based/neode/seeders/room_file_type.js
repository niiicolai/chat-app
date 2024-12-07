import data from '../../../seed_data.js';

export default class RoomFileTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.room_file_types.map(async (state) => {
            return neodeInstance.model('RoomFileType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:RoomFileType) DETACH DELETE n');
    }
}

import data from "./data.js";

export default class RoomCategorySeeder {
    async up(neodeInstance) {
        for (let state of data.room_categories) {
            neodeInstance.model('RoomCategory').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.room_categories) {
            const savedState = await neodeInstance.model('RoomCategory').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}
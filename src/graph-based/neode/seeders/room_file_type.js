import data from "./data.js";

export default class RoomFileTypeSeeder {
    async up(neodeInstance) {
        for (let state of data.room_file_types) {
            neodeInstance.model('RoomFileType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.room_file_types) {
            const savedState = await neodeInstance.model('RoomFileType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}
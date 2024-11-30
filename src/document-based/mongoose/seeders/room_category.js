import RoomCategory from '../models/room_category.js';
import data from '../../../seed_data.js';

export default class RoomCategorySeeder {
    async up() {
        await RoomCategory.insertMany(data.room_categories);
    }

    async down() {
        if (await RoomCategory.exists()) {
            await RoomCategory.collection.drop();
        }
    }
}

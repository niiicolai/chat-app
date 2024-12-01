import RoomCategory from '../models/room_category.js';
import data from '../../../seed_data.js';

export default class RoomCategorySeeder {
    async up() {
        await RoomCategory.insertMany(data.room_categories.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await RoomCategory.exists()) {
            await RoomCategory.collection.drop();
        }
    }
}

import RoomCategory from '../models/room_category.js';
import data from './data.js';

export default class RoomCategorySeeder {
    async up() {
        await RoomCategory.insertMany(data.room_categories);
    }

    async down() {
        await RoomCategory.deleteMany({ name: { $in: data.room_categories.map((d) => d.name) } });
    }
}

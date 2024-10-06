import RoomCategory from '../models/room_category.js';

const data = [
    { name: 'General' },
    { name: 'Tech' },
    { name: 'Sports' },
    { name: 'Music' },
    { name: 'Movies' },
    { name: 'Books' },
    { name: 'Gaming' },
    { name: 'Food' },
    { name: 'Travel' },
    { name: 'Fitness' },
    { name: 'Fashion' },
    { name: 'Art' },
    { name: 'Science' },
    { name: 'Politics' },
    { name: 'Business' },
    { name: 'Education' },
    { name: 'Health' },
    { name: 'Lifestyle' },
    { name: 'Entertainment' },
    { name: 'Other' },
];

export default class RoomCategorySeeder {
    async up() {
        await RoomCategory.insertMany(data);
    }

    async down() {
        await RoomCategory.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}

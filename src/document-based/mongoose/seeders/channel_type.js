import ChannelType from '../models/channel_type.js';
import data from '../../../seed_data.js';

export default class ChannelTypeSeeder {
    async up() {
        await ChannelType.insertMany(data.channel_types.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await ChannelType.exists()) {
            await ChannelType.collection.drop();
        }
    }
}

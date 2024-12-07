import ChannelMessageType from '../models/channel_message_type.js';
import data from '../../../seed_data.js';

export default class ChannelMessageTypeSeeder {
    async up() {
        await ChannelMessageType.insertMany(data.channel_message_types.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await ChannelMessageType.exists()) {
            await ChannelMessageType.collection.drop();
        }
    }
}

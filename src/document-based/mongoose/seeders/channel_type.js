import ChannelType from '../models/channel_type.js';
import data from './data.js';

export default class ChannelTypeSeeder {
    async up() {
        await ChannelType.insertMany(data.channel_types);
    }

    async down() {
        await ChannelType.collection.drop();
    }
}

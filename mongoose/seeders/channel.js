import Channel from '../models/channel.js';
import data from './data.js';

export default class ChannelSeeder {
    async up() {
        await Channel.insertMany(data.channels);
    }

    async down() {
        await Channel.deleteMany({ uuid: { $in: data.channels.map((d) => d.uuid) } });
    }
}

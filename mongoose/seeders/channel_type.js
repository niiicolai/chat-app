import ChannelType from '../models/channel_type.js';

const data = [
    { name: 'Text' },
    { name: 'Call' },
];

export default class ChannelTypeSeeder {
    async up() {
        await ChannelType.insertMany(data);
    }

    async down() {
        await ChannelType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}

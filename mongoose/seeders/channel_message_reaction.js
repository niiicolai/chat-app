import ChannelMessageReaction from '../models/channel_message_reaction.js';
import data from './data.js';

export default class ChannelMessageReactionSeeder {
    async up() {
        await ChannelMessageReaction.insertMany(data.channel_message_reactions);
    }

    async down() {
        await ChannelMessageReaction.deleteMany({ uuid: { $in: data.channel_message_reactions.map((d) => d.uuid) } });
    }
}

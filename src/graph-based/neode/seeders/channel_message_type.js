import data from "./data.js";

export default class ChannelMessageTypeSeeder {
    async up(neodeInstance) {
        for (let state of data.channel_message_types) {
            neodeInstance.model('ChannelMessageType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.channel_message_types) {
            const savedState = await neodeInstance.model('ChannelMessageType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}

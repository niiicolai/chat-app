
import model from '../models/channel_message.js';
import dto from '../dtos/channel_message.js';

class ChannelMessageService  {
    async findAll(options={page: 1, limit: 10, channel_uuid: null}) {
        super.findAll(options, 
            { channel_uuid: options.channel_uuid },
        );
    }
}

// Create a new service
const service = new ChannelMessageService({ model, dto });

// Export the service
export default {model,dto};

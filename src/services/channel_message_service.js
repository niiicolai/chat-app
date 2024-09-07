
import model from '../models/channel_message.js';
import dto from '../dtos/channel_message.js';
import RoomSettingService from './room_setting_service.js';
import ControllerError from '../errors/controller_error.js';
import ChannelService from './channel_service.js';
import UserService from './user_service.js';
import MessageUploadService from './message_upload_service.js';
import { v4 as uuidv4 } from 'uuid';

class ChannelMessageService {
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { pk: null, user: null }) {        
        const channelMessage = await model
            .throwIfNotPresent(findArgs.pk, 'uuid is required')
            .throwIfNotPresent(findArgs.user.sub, 'user is required')
            .find()
            .where(model.pk, findArgs.pk)
            .include(UserService.model, 'uuid', 'user_uuid')
            .dto(dto)
            .throwIfNotFound()
            .executeOne();

        const { user } = findArgs;
        const channel_uuid = channelMessage.channel_uuid;
        if (!await ChannelService.isInRoom({ channel_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        return channelMessage;
    }

    async findAll(findAllArgs = { page: 1, limit: 10, channel_uuid: null, user: null }) {        
        model
            .throwIfNotPresent(findAllArgs.channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(findAllArgs.user, 'user is required')

        const { page, limit, user, channel_uuid } = findAllArgs;
        if (!await ChannelService.isInRoom({ channel_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        return await model
            .find({ page, limit })
            .where('channel_uuid', channel_uuid)
            .include(UserService.model, 'uuid', 'user_uuid')
            .include(MessageUploadService.model, 'channel_message_uuid')
            .orderBy('channelmessage.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    async create(createArgs = { body: null, user: null }, transaction) {
        if (!createArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!createArgs.body.body)
            throw new ControllerError(400, 'body is required');
        if (!createArgs.body.channel_uuid)
            throw new ControllerError(400, 'channel_uuid is required');
        if (!createArgs.body.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user)
            throw new ControllerError(400, 'User is required');

        const pk = createArgs.body[model.pk];
        const user = createArgs.user;
        if (pk && await this.findOne({ pk, user })) {
            throw new ControllerError(400, 'A channel message with the same primary key already exists');
        }

        const channel_uuid = createArgs.body.channel_uuid;
        if (!await ChannelService.isInRoom({ channel_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');
        
        createArgs.body.user_uuid = user.sub;

        if (!createArgs.body.created_by_system) {
            createArgs.body.created_by_system = 0;
        }

        const transactionMethod = async (t) => {
            await model
                .create(createArgs.body)
                .transaction(t)
                .execute();

            if (createArgs.file) {
                const channel = await ChannelService.findOne({ pk: channel_uuid, user });
                if (!channel)
                    throw new ControllerError(404, 'Channel not found');

                // Throws an error if the user is not allowed to upload a file
                await RoomSettingService.canUpload({
                    room_uuid: channel.room_uuid,
                    byteSize: createArgs.file.size,
                    user
                });

                const sum = await MessageUploadService.sum({ channel_uuid: channel.uuid, field: 'size' });
                if ((sum + size) > roomSetting.total_upload_bytes)
                    throw new ControllerError(400, `The room has used ${sum / 1000000} MB of the total upload limit of ${roomSetting.total_upload_bytes / 1000000} MB. The file size is ${size / 1000000} MB and the new total would be ${(sum + size) / 1000000} MB`);

                await MessageUploadService.create({
                    uuid: uuidv4(),
                    channel_message_uuid: createArgs.body.uuid,
                }, createArgs.file, t);
            }
        };

        if (transaction) await transactionMethod(transaction);
        else await model.defineTransaction(transactionMethod);

        return await this.findOne({ pk, user });
    }

    async update(updateArgs = { pk: null, body: null, user: null }, transaction) {
        if (!updateArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!updateArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!updateArgs.user)
            throw new ControllerError(400, 'User is required');

        const { body, pk } = updateArgs;
        const channelMessage = await this.findOne({ pk, user: updateArgs.user });
        if (!channelMessage)
            throw new ControllerError(404, 'channel message not found');

        const channel_uuid = channelMessage.channel_uuid;
        const user = updateArgs.user;
        if (user.sub !== channelMessage.user_uuid && !await ChannelService.isInRoom({ channel_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        body.user_uuid = channelMessage.user_uuid;
        body.channel_uuid = channelMessage.channel_uuid;
        body.created_by_system = channelMessage.created_by_system;

        await model
            .update(body)
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();

        return await this.findOne({ pk, user: updateArgs.user });
    }

    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const channelMessage = await this.findOne({ pk, user: destroyArgs.user });
        if (!channelMessage)
            throw new ControllerError(404, 'channel message not found');

        const channel_uuid = channelMessage.channel_uuid;
        const user = destroyArgs.user;
        if (user.sub !== channelMessage.user_uuid && !await ChannelService.isInRoom({ channel_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }
}

// Create a new service
const service = new ChannelMessageService();

// Export the service
export default service;

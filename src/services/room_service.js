import UserRoomService from './user_room_service.js';
import RoomSettingService from './room_setting_service.js';
import RoomInviteLinkService from './room_invite_link_service.js';
import ControllerError from '../errors/controller_error.js';
import model from '../models/room.js';
import dto from '../dtos/room.js';
import StorageService from './storage_service.js';
import UploadError from '../errors/upload_error.js';

const storageService = new StorageService('room_avatars');
const upload = async (uuid, file) => {
    try {
        const { buffer, mimetype } = file;
        const originalname = file.originalname.split('.').slice(0, -1).join('.').replace(/\s/g, '');
        const timestamp = new Date().getTime();
        const filename = `${originalname}-${uuid}-${timestamp}.${mimetype.split('/')[1]}`;
        return await storageService.uploadFile(buffer, filename);
    } catch (error) {
        if (error instanceof UploadError) 
            throw new ControllerError(400, error.message);

        throw new ControllerError(500, error.message);
    }
};

class RoomService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne({ pk, user }) {
        return await model
            .throwIfNotPresent([pk], 'uuid is required')
            .throwIfNotPresent(user, 'user is required')
            .throwIfNotPresent(user.sub, 'user.sub is required')
            .find()
            .include(UserRoomService.model, 'room_uuid')
            .include(RoomSettingService.model, 'room_uuid')
            .where(`${model.mysql_table}.${model.pk}`, pk)
            .where('user_uuid', user.sub)            
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    async findAll({ page, limit, user }) {
        return await model
            .throwIfNotPresent(user, 'user is required')
            .find({ page, limit })
            .where('user_uuid', user.sub)
            .include(UserRoomService.model, 'room_uuid')
            .include(RoomSettingService.model, 'room_uuid')
            .orderBy('room.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    async create(createArgs = { body: null, user: null }, transaction) {
        if (!createArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!createArgs.body.name)
            throw new ControllerError(400, 'name is required');
        if (!createArgs.body.description)
            throw new ControllerError(400, 'description is required');
        if (!createArgs.body.room_category_name)
            throw new ControllerError(400, 'room_category_name is required');
        if (!createArgs.body.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user)
            throw new ControllerError(400, 'User is required');

        const pk = createArgs.body[model.pk];
        if (pk && await model.findOne({ pk })) {
            throw new ControllerError(400, 'Resource already exists');
        }
        
        const nameCheck = await model.findOneByField({
            fieldName: 'name',
            fieldValue: createArgs.body.name
        });
        if (nameCheck) throw new ControllerError(400, 'Name is already in use');

        const userRoomArgs = {
            body: { uuid: pk, room_uuid: pk, user_uuid: createArgs.user.sub, room_role_name: 'Admin' },
            user: createArgs.user
        };

        const roomSettingArgs = {
            body: { 
                uuid: pk, 
                room_uuid: pk, 
                total_upload_bytes: process.env.ROOM_TOTAL_UPLOAD_SIZE,
                upload_bytes: process.env.ROOM_UPLOAD_SIZE,
                join_message: process.env.ROOM_JOIN_MESSAGE,
                rules_text: process.env.ROOM_RULES_TEXT,
                max_channels: process.env.ROOM_MAX_CHANNELS,
                max_members: process.env.ROOM_MAX_MEMBERS
            },
            user: createArgs.user
        }

        if (createArgs.file) {
            createArgs.body.avatar_src = await upload(pk, createArgs.file);
        }

        const transactionMethod = async (t) => {
            await model.create({ body: createArgs.body, transaction: t });
            await UserRoomService.create(userRoomArgs, t);
            await RoomSettingService.create(roomSettingArgs, t);
        };

        if (transaction) await transactionMethod(transaction);
        else await model.transaction(transactionMethod);

        const resource = await model.findOne({ pk });
        return dto(resource);
    }

    // Not public, so it require a user object
    async update(updateArgs = { pk: null, body: null, user: null }, transaction) {
        if (!updateArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!updateArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!updateArgs.user)
            throw new ControllerError(400, 'User is required');

        const { body, pk } = updateArgs;
        const room = await this.findOne({ pk, user: updateArgs.user });
        if (!room)
            throw new ControllerError(404, 'room not found');

        const room_uuid = room.uuid;
        const user = updateArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        if (updateArgs.file) {
            updateArgs.body.avatar_src = await upload(pk, updateArgs.file);
        } else {
            updateArgs.body.avatar_src = room.avatar_src;
        }

        if (!updateArgs.body.name)
            updateArgs.body.name = room.name;
        if (!updateArgs.body.description)
            updateArgs.body.description = room.description;
        if (!updateArgs.body.room_category_name)
            updateArgs.body.room_category_name = room.room_category_name;

        const transactionMethod = async (t) => {
            await model.update({ pk, body, transaction: t });
        };

        if (transaction) await transactionMethod(transaction);
        else await model.transaction(transactionMethod);        

        return await this.findOne({ pk, user: updateArgs.user });
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const room = await this.findOne({ pk, user: destroyArgs.user });
        if (!room)
            throw new ControllerError(404, 'room not found');
        
        const room_uuid = room.uuid;
        const user = destroyArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        const transactionMethod = async (t) => {
            const roomInviteLinks = await RoomInviteLinkService.findAll({ room_uuid, user });
            for (const roomInviteLink of roomInviteLinks.data) {
                await RoomInviteLinkService.destroy({ pk: roomInviteLink.uuid, user }, t);
            }

            const userRooms = await UserRoomService.findAll({ where: { room_uuid: pk } });
            for (const userRoom of userRooms.data) {
                await UserRoomService.destroy({ pk: userRoom.uuid, user: destroyArgs.user }, t);
            }

            await model.destroy({ pk, transaction: t });
        };

        if (transaction) await transactionMethod(transaction);
        else await model.transaction(transactionMethod);
    }
}

// Create a new service
const service = new RoomService();

// Export the service
export default service;

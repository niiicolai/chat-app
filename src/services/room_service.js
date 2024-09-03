import UserRoomService from './user_room_service.js';
import RoomInviteLinkService from './room_invite_link_service.js';
import ControllerError from '../errors/controller_error.js';
import model from '../models/room.js';
import dto from '../dtos/room.js';

class RoomService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { pk: null, user: null }) {
        if (!findArgs.pk)
            throw new ControllerError(400, 'Primary key is required');
        if (!findArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk, user } = findArgs;
        const room = await model.findOne(model
            .optionsBuilder()
            .findOne(pk)
            .where('user_uuid', user.sub)
            .include(UserRoomService.model, 'room_uuid')
            .build());

        if (!room)
            throw new ControllerError(404, 'Room not found');

        return dto(room);
    }

    async findAll(findAllArgs = { page: 1, limit: 10, user: null }) {
        if (!findAllArgs.user)
            throw new ControllerError(400, 'User is required');

        const { page, limit, user } = findAllArgs;
        const options = model
            .optionsBuilder()
            .findAll(page, limit)
            .where('user_uuid', user.sub)
            .include(UserRoomService.model, 'room_uuid')
            .build()

        const total = await model.count(options);
        const rooms = await model.findAll(options);
        const pages = Math.ceil(total / limit);
        const data = rooms.map(room => dto(room));

        return {
            data,
            meta: {
                total,
                page,
                pages
            }
        };
    }

    async create(createArgs = { body: null, user: null }) {
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

        await this.model.create(createArgs.body);
        await UserRoomService.create(userRoomArgs);
        const resource = await model.findOne({ pk });

        return dto(resource);
    }

    // Not public, so it require a user object
    async update(updateArgs = { pk: null, body: null, user: null }) {
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

        await model.update({ pk, body });

        return await this.findOne({ pk, user: updateArgs.user });
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }) {
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

        const roomInviteLinks = await RoomInviteLinkService.findAll({ room_uuid, user });
        for (const roomInviteLink of roomInviteLinks.data) {
            await RoomInviteLinkService.destroy({ pk: roomInviteLink.uuid, user });
        }

        const userRooms = await UserRoomService.findAll({ where: { room_uuid: pk } });
        for (const userRoom of userRooms.data) {
            await UserRoomService.destroy({ pk: userRoom.uuid, user: destroyArgs.user });
        }

        await model.destroy({ pk });
    }
}

// Create a new service
const service = new RoomService();

// Export the service
export default service;

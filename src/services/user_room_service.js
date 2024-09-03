
import ControllerError from '../errors/controller_error.js';
import model from '../models/user_room.js';
import dto from '../dtos/user_room.js';


class UserRoomService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { room_uuid: null, user: null }) {
        if (!findArgs.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');
        if (!findArgs.user)
            throw new ControllerError(400, 'User is required');

        const { room_uuid, user } = findArgs;
        const userRooms = await model.findAll(model
            .optionsBuilder()
            .where('user_uuid', user.sub)
            .where('room_uuid', room_uuid)
            .build());

        if (userRooms.length === 0)
            throw new ControllerError(404, 'User room not found');

        const userRoom = userRooms[0];
        
        return dto(userRoom);
    }

    async isInRoom(findArgs = { room_uuid: null, user: null, room_role_name: null }) {
        if (!findArgs.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');
        if (!findArgs.user)
            throw new ControllerError(400, 'User is required');

        const { room_uuid, user } = findArgs;
        const userRooms = await model.findAll(model
            .optionsBuilder()
            .where('user_uuid', user.sub)
            .where('room_uuid', room_uuid)
            .build());
            
        if (!findArgs.room_role_name)
            return userRooms.length > 0;
        
        return userRooms.length > 0 && userRooms[0].user_room_room_role_name == findArgs.room_role_name;
    }

    async findAll(findAllArgs = { user: null, where: {} }) {
        const { page, limit, user } = findAllArgs;
        let options = model
            .optionsBuilder()
            .findAll(page, limit)
        
        if (user) 
            options.where('user_uuid', user.sub)

        for (const key in findAllArgs.where) {
            options.where(key, findAllArgs.where[key]);
        }
        options = options.build();

        const total = await model.count(options);
        const userRooms = await model.findAll(options);
        const pages = Math.ceil(total / limit);
        const data = userRooms.map(userRoom => dto(userRoom));

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
        if (!createArgs.body.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');
        if (!createArgs.body.room_role_name)
            throw new ControllerError(400, 'room_role_name is required');
        if (!createArgs.body.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user)
            throw new ControllerError(400, 'User is required');

        const pk = createArgs.body[model.pk];
        if (pk && await model.findOne({ pk })) {
            throw new ControllerError(400, 'Resource already exists');
        }

        createArgs.body.user_uuid = createArgs.user.sub;

        await this.model.create(createArgs.body);
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
        const userRoom = await model.findOne({ pk });
        if (!userRoom)
            throw new ControllerError(404, 'userRoom not found');

        if (!this.findOne({ room_uuid: userRoom.user_room_room_uuid, user: destroyArgs.user }))
            throw new ControllerError(404, 'User is not in the room');

        await model.update({ pk, body });

        return await this.show({ pk, user: updateArgs.user });
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const userRoom = await model.findOne({ pk });
        if (!userRoom)
            throw new ControllerError(404, 'userRoom not found');

        if (!this.findOne({ room_uuid: userRoom.user_room_room_uuid, user: destroyArgs.user }))
            throw new ControllerError(404, 'User is not in the room');

        await model.destroy({ pk });
    }
}

// Create a new service
const service = new UserRoomService();

// Export the service
export default service;

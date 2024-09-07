
import ControllerError from '../errors/controller_error.js';
import model from '../models/user_room.js';
import dto from '../dtos/user_room.js';
import UserService from './user_service.js';

class UserRoomService {
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async count({ where={} }) {
        const operation = model.count();

        for (const key in where) {
            operation.where(key, 
                where[key].value, 
                where[key].operator
            );
        }

        return await operation.execute();
    }

    async findOne({ room_uuid, user }) {
        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where('room_uuid', room_uuid)
            .where('user_uuid', user.sub)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    async isInRoom({ room_uuid, user, room_role_name }) {
        const userRoom = await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .throwIfNotPresent(user.sub, 'user_uuid is required')
            .find()
            .where('user_uuid', user.sub)
            .where('room_uuid', room_uuid)
            .dto(dto)
            .executeOne();

        return userRoom &&
            (room_role_name ? userRoom.room_role_name == room_role_name : true);
    }

    async findAll(options={}) {
        const page = options.page;
        const limit = options.limit;
        const where = options.where;
        const room_uuid = options.room_uuid;
        const res = await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .find({ page, limit })
            .include(UserService.model, 'uuid', 'user_uuid');

        if (where) {
            for (const key in where) {
                res.where(key,
                    where[key].value,
                    where[key].operator
                );
            }
        }

        return await res
            .where('room_uuid', room_uuid)
            .orderBy('userroom.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    async create(createArgs = { body: null, user: null }, transaction) {
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

        await this.model.create({ body: createArgs.body, transaction });
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
        const userRoom = await model.findOne({ pk });
        if (!userRoom)
            throw new ControllerError(404, 'userRoom not found');

        if (!this.findOne({ room_uuid: userRoom.user_room_room_uuid, user: destroyArgs.user }))
            throw new ControllerError(404, 'User is not in the room');

        await model.update({ pk, body, transaction });

        return await this.show({ pk, user: updateArgs.user });
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const userRoom = await model.findOne({ pk });
        if (!userRoom)
            throw new ControllerError(404, 'userRoom not found');

        const role = userRoom.user_room_room_role_name;
        if (role == 'Admin') {
            throw new ControllerError(400, 'Admin cannot be removed from the room');
        }

        if (!this.findOne({ room_uuid: userRoom.user_room_room_uuid, user: destroyArgs.user }))
            throw new ControllerError(404, 'User is not in the room');

        await model.destroy({ pk, transaction });
    }
}

// Create a new service
const service = new UserRoomService();

// Export the service
export default service;

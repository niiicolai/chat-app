
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
        return await model.count()
            .each(Object.keys(where), (data, options) => {
                options.where(data.key, data.value, data.operator);
            })
            .execute();
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

        return userRoom && (room_role_name 
            ? userRoom.room_role_name == room_role_name 
            : true
        );
    }

    async findAll(options={}) {
        const { page, limit, room_uuid, where={} } = options;
        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .find({ page, limit })
            .include(UserService.model, 'uuid', 'user_uuid')
            .each(Object.keys(where), (data, options) => {
                options.where(data.key, data.value, data.operator); 
            })
            .where('room_uuid', room_uuid)
            .orderBy('userroom.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    async create(createArgs = { body: null, user: null }, transaction) {
        await model.throwIfNotPresent(createArgs.body, 'Resource body is required')
            .throwIfNotPresent(createArgs.body.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(createArgs.body.room_role_name, 'room_role_name is required')
            .throwIfNotPresent(createArgs.body.uuid, 'uuid is required')
            .throwIfNotPresent(createArgs.user, 'User is required')
            .find().where(model.pk, createArgs.body.uuid).throwIfFound().executeOne();

        await this.model
            .create({ body: { ...createArgs.body, user_uuid: createArgs.user.sub } })
            .transaction(transaction)
            .execute();

        return await this.findOne({ 
            room_uuid: createArgs.body.room_uuid, 
            user: createArgs.user 
        });
    }

    async update(updateArgs = { pk: null, body: null, user: null }, transaction) {
        const userRoom = await model
            .throwIfNotPresent(updateArgs.pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(updateArgs.body, 'Resource body is required')
            .throwIfNotPresent(updateArgs.user, 'User is required')
            .find()
            .where(model.pk, updateArgs.pk)
            .throwIfNotFound()
            .executeOne();

        if (!this.isInRoom({ 
            room_uuid: userRoom.room_uuid,
            user: updateArgs.user,
            room_role_name: 'Admin'
        })) throw new ControllerError(404, 'User is not in the room');

        await model.update({ body })
            .where(model.pk, updateArgs.pk)
            .transaction(transaction)
            .execute();

        return await this.findOne({ 
            room_uuid: userRoom.room_uuid, 
            user: updateArgs.user 
        });
    }

    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        const userRoom = await model
            .throwIfNotPresent(destroyArgs.pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(destroyArgs.user, 'User is required')
            .find()
            .where(model.pk, destroyArgs.pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        if (userRoom.room_role_name === 'Admin') {
            throw new ControllerError(400, 'Admin cannot be removed from the room');
        }

        if (!this.isInRoom({ 
            room_uuid: userRoom.room_uuid,
            user: destroyArgs.user,
            room_role_name: 'Admin'
        })) throw new ControllerError(404, 'User is not in the room');

        await model
            .destroy()
            .where(model.pk, destroyArgs.pk)
            .transaction(transaction)
            .execute();
    }
}

const service = new UserRoomService();

export default service;

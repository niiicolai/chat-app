import ControllerError from '../errors/controller_error.js';
import JwtService from './jwt_service.js';
import model from '../models/user.js';
import dto from '../dtos/user.js';
import userProfileDto from '../dtos/user_profile.js';
import StorageService from './storage_service.js';
import UploadError from '../errors/upload_error.js';

const storageService = new StorageService('user_avatars');
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

/**
 * @class UserService
 */
class UserService {
    constructor() {
        this.model = model;
        this.dto = dto;
        this.userProfileDto = userProfileDto;
    }

    template() {
        return this.model.template();
    }

    async me(user) {
        console.log(user)
        return await this.model
            .throwIfNotPresent(user, 'user is required')
            .throwIfNotPresent(user.sub, 'user.sub is required')
            .find()
            .where(model.pk, user.sub)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    async findOne({ pk }) {
        await this.model
            .throwIfNotPresent(pk, 'Primary key value is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(userProfileDto)
            .executeOne();
    }

    async create({ body, file }, transaction) {
        model.throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.email, 'Email is required')
            .throwIfNotPresent(body.password, 'Password is required')
            .throwIfNotPresent(body.username, 'Username is required')
            .throwIfNotPresent(body.uuid, 'uuid is required');

        await this.findOne({ pk: body.uuid })
        
        await model
            .find()
            .where('email', body.email)
            .throwIfFound()
            .executeOne();

        await model
            .find()
            .where('username', body.username)
            .throwIfFound()
            .executeOne();

        if (file) {
            body.avatar_src = await upload(pk, file);
        }

        await model
            .create(body)
            .transaction(transaction)
            .execute();

        const user = await this.findOne({ pk });
        const token = JwtService.sign(body.uuid);

        return { user, token };
    }

    async update({ pk, body, user }, transaction) {
        model.throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required');

        if (user.sub !== pk) throw new ControllerError(403, 'Forbidden');

        await model
            .find()
            .where('email', body.email)
            .throwIfFound()
            .executeOne();

        await model
            .find()
            .where('username', body.username)
            .throwIfFound()
            .executeOne();

        const current = await this.findOne({ pk });
        if (file) body.avatar_src = await upload(pk, file);
        else body.avatar_src = current.avatar_src;

        if (!body.email) body.email = current.email;
        if (!body.username) body.username = current.username;
        if (!body.password) body.password = current.password;

        await model
            .update(body)
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();

        return await this.findOne({ pk });
    }

    async destroy({ pk, user }, transaction) {
        model.throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required');

        if (user.sub !== pk)
            throw new ControllerError(403, 'Forbidden');

        await this.findOne({ pk });        
        await model.optionsBuilder()
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    async login({ email, password }) {        
        const user = await model
            .throwIfNotPresent(email, 'Email is required')
            .throwIfNotPresent(password, 'Password is required')
            .find()
            .where('email', email)                        
            .throwIfNotFound()
            .executeOne();
        
        await model.throwIfNoPasswordMatch(password, user.user_password);
        return { user: dto(user), token: JwtService.sign(user.user_uuid) };
    }
}

const service = new UserService();

export default service;

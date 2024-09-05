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
        // For the controller
        this.model = model;
        this.dto = dto;
        this.userProfileDto = userProfileDto;
    }

    template() {
        return this.model.template();
    }

    async me(user) {
        if (!user) 
            throw new ControllerError(400, 'User is required');

        const pk = user.sub;
        const resource = await model.findOne({ pk });
        if (!resource) 
            throw new ControllerError(404, 'User not found');

        return dto(resource);
    }

    // Public, so it uses the profile DTO
    async show(findArgs={pk: null}) {
        if (!findArgs.pk) 
            throw new ControllerError(400, 'Primary key is required');

        const pk = findArgs.pk;
        const user = await model.findOne({ pk });

        if (!user) 
            throw new ControllerError(404, 'User not found');

        return userProfileDto(user);
    }

    async create(createArgs={body: null}) {
        if (!createArgs.body) 
            throw new ControllerError(400, 'Resource body is required');
        if (!createArgs.body.email) 
            throw new ControllerError(400, 'Email is required');
        if (!createArgs.body.password)
            throw new ControllerError(400, 'Password is required');
        if (!createArgs.body.username) 
            throw new ControllerError(400, 'Username is required');

        const pk = createArgs.body[model.pk];
        if (pk && await model.findOne({ pk })) {
            throw new ControllerError(400, 'Resource already exists');
        }

        const emailCheck = await model.findOneByField({ 
            fieldName: 'email', 
            fieldValue: createArgs.body.email 
        });
        if (emailCheck) throw new ControllerError(400, 'Resource already exists');

        const usernameCheck = await model.findOneByField({ 
            fieldName: 'username', 
            fieldValue: createArgs.body.username 
        });
        if (usernameCheck) throw new ControllerError(400, 'Resource already exists');

        if (createArgs.file) {
            createArgs.body.avatar_src = await upload(pk, createArgs.file);
        }
        
        await this.model.create(createArgs.body);
        const resource = await model.findOne({ pk });

        const token = JwtService.sign(resource.user_uuid);

        return { user: dto(resource), token };
    }

    // Not public, so it require a user object
    async update(updateArgs={pk: null, body: null, user: null}) {
        if (!updateArgs.pk) 
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!updateArgs.body) 
            throw new ControllerError(400, 'Resource body is required');
        if (!updateArgs.user) 
            throw new ControllerError(400, 'User is required');

        const { body, pk } = updateArgs;

        if (updateArgs.user.sub !== pk) 
            throw new ControllerError(403, 'Forbidden');

        const user = await model.findOne({ pk });
        if (!user) 
            throw new ControllerError(404, 'User not found');

        if (updateArgs.file) {
            updateArgs.body.avatar_src = await upload(pk, updateArgs.file);
        } else {
            updateArgs.body.avatar_src = user.avatar_src;
        }

        if (!updateArgs.body.email) 
            updateArgs.body.email = user.email;
        if (!updateArgs.body.username)
            updateArgs.body.username = user.username;
        if (!updateArgs.body.password)
            updateArgs.body.password = user.password;

        await model.update({ pk, body });
        const resource = await model.findOne({ pk });

        return dto(resource);
    }

    // Not public, so it require a user object
    async destroy(destroyArgs={pk: null, user: null}) {
        if (!destroyArgs.pk) 
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        if (destroyArgs.user.uuid !== pk) 
            throw new ControllerError(403, 'Forbidden');

        const user = await model.findOne({ pk });
        if (!user) 
            throw new ControllerError(404, 'User not found');

        await model.destroy({ pk });
    }

    async login(data) {
        const user = await model.findOneByField({ 
            fieldName: 'email', 
            fieldValue: data.email 
        });
        if (!user) 
            throw new ControllerError(404, 'User not found');

        const isValid = await model.comparePassword(user, data.password);
        if (!isValid) 
            throw new ControllerError(400, 'Invalid password');

        const token = JwtService.sign(user.uuid);

        return { user: dto(user), token };
    }
}

// Create a new service
const service = new UserService();

// Export the service
export default service;

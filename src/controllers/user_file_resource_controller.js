import UserResourceController from './user_resource_controller.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage()
});

const uploadMiddleware = [
    upload.single('file')
];

/**
 * @class UserFileResourceController
 * @extends UserResourceController
 */
export default class UserFileResourceController extends UserResourceController {
    constructor({ crudService }) {
        super({ crudService });
    }

    /**
     * @method create
     * @description Create a new message upload,
     * and add the upload middleware to the create method
     */
    create() {
        super.create(uploadMiddleware);
    }

    /**
     * @method createArgs
     * @description Create the arguments for the create method
     * @param {Object} req - The request object
     * @returns {Object} The arguments for the create method
     */
    createArgs(req) {
        return {
            ...super.createArgs(req),
            file: req.file
        };
    }

    /**
     * @method update
     * @description Update a message upload,
     * and add the upload middleware to the update method
     */
    update() {
        super.update(uploadMiddleware);
    }

    /**
     * @method updateArgs
     * @description Create the arguments for the update method
     * @param {Object} req - The request object
     * @returns {Object} The arguments for the update method
     */
    updateArgs(req) {
        return {
            ...super.updateArgs(req),
            file: req.file
        };
    }
}

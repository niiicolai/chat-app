import BaseController from './_base_controller.js';
import crudService from '../../services/user_service.js';

/**
 * @class UserController
 * @classdesc Controller for users
 * @extends BaseController
 */
class UserController extends BaseController {
    constructor() {
        super({ crudService, auth: {
            index: true,
            template: false,
            create: false,
            show: false,
            update: true,
            destroy: true
        }});

        this.template();
        this.create();
        this.show();
        this.update();
        this.destroy();
    }

    /**
     * @method indexArgs
     * @description Adds the user to the args object
     * @param {Object} req - The request object
     * @returns {Object} The args object
     */
    indexArgs(req) {
        return {
            ...super.indexArgs(req),
            user: req.user
        };
    }

    /**
     * @method showArgs
     * @description Adds the user to the args object
     * @param {Object} req - The request object
     * @returns {Object} The args object
     */
    showArgs(req) {
        return {
            ...super.showArgs(req),
            user: req.user
        };
    }

    /**
     * @method updateArgs
     * @description Adds the user to the args object
     * @param {Object} req - The request object
     * @returns {Object} The args object
     */
    updateArgs(req) {
        return {
            ...super.updateArgs(req),
            user: req.user
        };
    }

    /**
     * @method destroyArgs
     * @description Adds the user to the args object
     * @param {Object} req - The request object
     * @returns {Object} The args object
     */
    destroyArgs(req) {
        return {
            ...super.destroyArgs(req),
            user: req.user
        };
    }
}

const controller = new UserController();

controller.defineCustomRoute('post', 'login', async (req, res) => {
    const data = req.body;
    const user = await crudService.login(data);
    res.json(user);
}, false);

controller.defineCustomRoute('get', 'me', async (req, res) => {
    const user = await crudService.me(req.user);
    res.json(user);
}, true);

export default controller;

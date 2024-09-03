import BaseController from './_base_controller.js';

/**
 * @class UserResourceController
 * @extends BaseController
 * @description Includes the user_id in the where clause for all routes
 * and sets the auth object to true for index, show, create, update, and destroy
 */
export default class UserResourceController extends BaseController {
    constructor({ crudService, baseUrl }) {
        super({ crudService, auth: {
            index: true,
            show: true,
            template: false,
            create: true,
            update: true,
            destroy: true
        }, baseUrl });

        this.index();
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
     * @method createArgs
     * @description Adds the user to the args object
     * @param {Object} req - The request object
     * @returns {Object} The args object
     */
    createArgs(req) {
        return {
            ...super.createArgs(req),
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

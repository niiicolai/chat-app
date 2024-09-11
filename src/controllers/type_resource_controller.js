import BaseController from './base_controller.js';

/**
 * @class TypeResourceController
 * @extends BaseController
 * @description The default route setup for models defining a type resource.
 */
export default class TypeResourceController extends BaseController {
    constructor({ crudService, baseUrl }) {
        super({ crudService, auth: {
            index: false,
            show: false,
        }, baseUrl });

        this.index();
        this.show();
    }
}

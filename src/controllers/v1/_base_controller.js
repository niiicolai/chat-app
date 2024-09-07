
import AuthMiddleware from '../../middlewares/auth_middleware.js';
import LogMiddleware from '../../middlewares/log_middleware.js';
import ControllerError from '../../errors/controller_error.js';
import express from 'express';

/**
 * @function handleError
 * @description Handle errors in the controller
 * @param {Function} callback
 * @param {Object} res
 * @returns {undefined}
 */
const handleError = async (callback, res) => {
    try {
        await callback();
    } catch (error) {
        if (process.env.DEBUG) {
            console.log(error);
        }
        
        if (error instanceof ControllerError) {
            res.status(error.code).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

/**
 * @function initMiddleware
 * @description Initialize middleware
 * @param {Array} middleware
 * @param {Object} auth
 * @returns {Array} The middleware
 */
const initMiddleware = (middleware=[], auth=false) => {
    middleware.push(LogMiddleware); // Log before auth
    if (auth) middleware.push(AuthMiddleware);
    return middleware;
}

/**
 * @function initPaths
 * @description Initialize paths
 * @param {Object} ctrl
 * @returns {Object} The paths
 */
const initPaths = (ctrl) => {
    return {
        index: `${ctrl.baseUrl}/${ctrl.pluralName}`,
        template: `${ctrl.baseUrl}/${ctrl.singularName}/new`,
        create: `${ctrl.baseUrl}/${ctrl.singularName}`,
        show: `${ctrl.baseUrl}/${ctrl.singularName}/:${ctrl.pk}`,
        update: `${ctrl.baseUrl}/${ctrl.singularName}/:${ctrl.pk}`,
        destroy: `${ctrl.baseUrl}/${ctrl.singularName}/:${ctrl.pk}`
    }
}



/**
 * @class BaseController
 * @description Base controller class.
 * When calling one of the methods, fx index, template,
 * the method will define a route on the router property.
 * If you don't want a specific route to be defined, you
 * simply don't call the method.
 * @export BaseController
 */
export default class BaseController {

    /**
     * @constructor
     * @description Constructor for BaseController
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.crudService
     * @param {Object} options.auth
     */
    constructor(options = {crudService: null, auth: {}, baseUrl: '/api/v1'}) {
        if (!options) throw new Error('options is required');
        if (!options.crudService) throw new Error('crudService is required');
        if (!options.auth) throw new Error('auth is required');

        // Create a new express router
        this.router = express.Router();

        // Use information from the model to define
        // routes and paths
        this.pk = options.crudService.model.pk;
        this.singularName = options.crudService.model.singularName;
        this.pluralName = options.crudService.model.pluralName;

        // Define the routes that require a JWT token
        this.auth = options.auth;

        // Define the service that will be used to
        // interact with the database
        this.crudService = options.crudService;
        
        // Define the base URL for the controller ('/api/v1')        
        this.baseUrl = options.baseUrl || '/api/v1';

        // Define the default paths for the controller
        // { index: '/api/v1/channel_messages', template: '/api/v1/channel_message/new', ... }
        this.paths = initPaths(this);
    }

    /**
     * @function index
     * @description Define the index route for getting all resources
     * @returns {undefined}
     * @memberof BaseController
     */
    index(middleware=[]) {
        initMiddleware(middleware, this.auth.index);

        this.router.get(this.paths.index, middleware, async (req, res) => {
            handleError(async () => {
                const data = await this.crudService.findAll(this.indexArgs(req));
                res.json(data);
            }, res);
        });
    }

    /**
     * @function indexArgs
     * @description Get the arguments for the index route
     * @param {Object} req
     * @returns {Object}
     * @memberof BaseController
     */
    indexArgs(req) {
        const params = {}
        if (req.query.page) params.page = parseInt(req.query.page);
        if (req.query.limit) params.limit = parseInt(req.query.limit);
        return { ...req.query, page: params.page, limit: params.limit };
    }

    /**
     * @function template
     * @description Define the route for getting resource template
     * @returns {undefined}
     * @memberof BaseController
     */
    template(middleware=[]) {
        initMiddleware(middleware, this.auth.template);

        this.router.get(this.paths.template, middleware, (req, res) => {
            handleError(() => {
                const template = this.crudService.template();
                res.json(template);
            }, res);
        });
    }

    /**
     * @function create
     * @description Define the create route for creating a new resource
     * @returns {undefined}
     * @memberof BaseController
     */
    create(middleware=[]) {
        initMiddleware(middleware, this.auth.create);

        this.router.post(this.paths.create, middleware, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.create(this.createArgs(req));
                res.json(data);
            }, res);
        });
    }

    /**
     * @function createArgs
     * @description Get the arguments for the create route
     * @param {Object} req
     * @returns {Object}
     * @memberof BaseController
     */
    createArgs(req) {
        return {
            body: req.body
        }
    }

    /**
     * @function show
     * @description Define the show route for getting a single resource
     * @returns {undefined}
     * @memberof BaseController
     */
    show(middleware=[]) {
        initMiddleware(middleware, this.auth.show);

        this.router.get(this.paths.show, middleware, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.findOne(this.showArgs(req));
                res.json(data);
            }, res);
        });
    }

    /**
     * @function showArgs
     * @description Get the arguments for the show route
     * @param {Object} req
     * @returns {String}
     * @memberof BaseController
     */
    showArgs(req) {
        return {
            pk: req.params[this.pk]
        }
    }

    /**
     * @function update
     * @description Define the update route for updating a resource
     * @returns {undefined}
     * @memberof BaseController
     */
    update(middleware=[]) {
        initMiddleware(middleware, this.auth.update);

        this.router.patch(this.paths.update, middleware, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.update(this.updateArgs(req));
                res.json(data);
            }, res);
        });
    }

    /**
     * @function updateArgs
     * @description Get the arguments for the update route
     * @param {Object} req
     * @returns {Object}
     * @memberof BaseController
     */
    updateArgs(req) {
        return {
            pk: req.params[this.pk],
            body: req.body,
        }
    }

    /**
     * @function destroy
     * @description Define the destroy route for deleting a resource
     * @returns {undefined}
     * @memberof BaseController
     */
    destroy(middleware=[]) {
        initMiddleware(middleware, this.auth.destroy);

        this.router.delete(this.paths.destroy, middleware, (req, res) => {
            handleError(async () => {
                await this.crudService.destroy(this.destroyArgs(req));

                res.json({ message: 'Resource deleted' });
            }, res);
        });
    }

    /**
     * @function destroyArgs
     * @description Get the arguments for the destroy route
     * @param {Object} req
     * @returns {String}
     * @memberof BaseController
     */
    destroyArgs(req) {
        return {
            pk: req.params[this.pk]
        }
    }

    /**
     * @function defineCustomRoute
     * @description Define a custom route
     * @param {String} method
     * @param {String} url
     * @param {Function} callback
     * @param {Boolean} auth
     * @param {Array} middleware
     * @returns {undefined}
     * @memberof BaseController
     */
    defineCustomRoute(method, url, callback, auth=true, middleware=[]) {
        initMiddleware(middleware, auth);

        this.router[method](`${this.baseUrl}/${url}`, middleware, (req, res) => {
            handleError(async () => {
                await callback(req, res);
            }, res);
        });
    }
}

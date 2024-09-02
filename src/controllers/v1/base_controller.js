
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
 * @class BaseController
 * @description Base controller class
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
    constructor(options = {crudService: null, auth: {}}) {
        if (!options) throw new Error('options is required');
        if (!options.crudService) throw new Error('crudService is required');
        if (!options.auth) throw new Error('auth is required');

        this.router = express.Router();
        this.crudService = options.crudService;
        this.pk = options.crudService.model.pk;
        this.singularName = options.crudService.model.singularName;
        this.pluralName = options.crudService.model.pluralName;
        this.auth = options.auth;
        this.baseUrl = '/api/v1';
    }

    /**
     * @function _index
     * @description Define the index route for getting all resources
     * @returns {undefined}
     * @memberof BaseController
     */
    _index(middleware=[]) {
        const url = `${this.baseUrl}/${this.pluralName}`;
        middleware.push(LogMiddleware);
        if (this.auth._index) middleware.push(AuthMiddleware);

        this.router.get(url, middleware, (req, res) => {
            handleError(async () => {
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const data = await this.crudService.findAll(page, limit, req.user);
                res.json(data);
            }, res);
        });
    }

    /**
     * @function _new
     * @description Define the new route for getting resource template
     * @returns {undefined}
     * @memberof BaseController
     */
    _new(middleware=[]) {
        const url = `${this.baseUrl}/${this.singularName}/new`;
        middleware.push(LogMiddleware);
        if (this.auth._new) middleware.push(AuthMiddleware);

        this.router.get(url, middleware, (req, res) => {
            handleError(() => {
                res.json(this.crudService.template());
            }, res);
        });
    }

    /**
     * @function _create
     * @description Define the create route for creating a new resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _create(middleware=[]) {
        const url = `${this.baseUrl}/${this.singularName}`;
        middleware.push(LogMiddleware);
        if (this.auth._create) middleware.push(AuthMiddleware);

        this.router.post(url, middleware, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.create(req.body, req.file, req.user);
                res.json(data);
            }, res);
        });
    }

    /**
     * @function _show
     * @description Define the show route for getting a single resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _show(middleware=[]) {
        const url = `${this.baseUrl}/${this.singularName}/:${this.pk}`;
        middleware.push(LogMiddleware);
        if (this.auth._show) middleware.push(AuthMiddleware);

        this.router.get(url, middleware, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.findOne(req.params[this.pk], req.user);
                res.json(data);
            }, res);
        });
    }

    /**
     * @function _update
     * @description Define the _update route for updating a resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _update(middleware=[]) {
        const url = `${this.baseUrl}/${this.singularName}/:${this.pk}`;
        middleware.push(LogMiddleware);
        if (this.auth._update) middleware.push(AuthMiddleware);

        this.router.patch(url, middleware, (req, res) => {
            handleError(async () => {
                await this.crudService.update(req.params[this.pk], req.body, req.file, req.user);

                res.status(204).json();
            }, res);
        });
    }

    /**
     * @function _destroy
     * @description Define the destroy route for deleting a resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _destroy(middleware=[]) {
        const url = `${this.baseUrl}/${this.singularName}/:${this.pk}`;
        middleware.push(LogMiddleware);
        if (this.auth._destroy) middleware.push(AuthMiddleware);

        this.router.delete(url, middleware, (req, res) => {
            handleError(async () => {
                await this.crudService.destroy(req.params[this.pk], req.user);

                res.status(204).json();
            }, res);
        });
    }

    defineCustomRoute(method, url, callback, auth=true, middleware=[]) {
        middleware.push(LogMiddleware);
        if (auth) middleware.push(AuthMiddleware);

        this.router[method](`${this.baseUrl}/${url}`, middleware, (req, res) => {
            handleError(async () => {
                await callback(req, res);
            }, res);
        });
    }
}


import AuthMiddleware from '../../middlewares/auth_middleware.js';
import ControllerError from '../../errors/controller_error.js';
import express from 'express';

/**
 * @function handleError
 * @description Handle errors in the controller
 * @param {Function} callback
 * @param {Object} res
 * @returns {undefined}
 */
const handleError = (callback, res) => {
    try {
        callback();
    } catch (error) {
        if (error instanceof ControllerError) {
            res.status(error.code).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }

        if (process.env.DEBUG) {
            console.error(error);
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
     * @param {String} options.baseUrl
     * @param {String} options.pk
     * @param {Object} options.crudService
     * @param {Object} options.auth
     */
    constructor(options = {baseUrl: '', crudService: null, auth: {}}) {
        if (!options) throw new Error('options is required');
        if (!options.crudService) throw new Error('crudService is required');
        if (!options.auth) throw new Error('auth is required');

        this.router = express.Router();
        this.crudService = options.crudService;
        this.pk = options.crudService.model.pk;
        this.singularName = options.crudService.model.singularName;
        this.pluralName = options.crudService.model.pluralName;
        this.auth = options.auth;
    }

    /**
     * @function _index
     * @description Define the index route for getting all resources
     * @returns {undefined}
     * @memberof BaseController
     */
    _index() {
        const url = `/${this.pluralName}`;
        const auth = this.auth._index ? AuthMiddleware : [];

        this.router.get(url, auth, (req, res) => {
            handleError(async () => {
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const data = await this.crudService.findAll(page, limit);
                res.json(data);
            }, res);
        });

        if (process.env.DEBUG)
            console.log(`${this.pluralName} (index): curl -X GET http://localhost:${process.env.WEB_PORT}${url}`);
    }

    /**
     * @function _new
     * @description Define the new route for getting resource template
     * @returns {undefined}
     * @memberof BaseController
     */
    _new() {
        const url = `/${this.singularName}/new`;
        const auth = this.auth._new ? AuthMiddleware : [];

        this.router.get(url, auth, (req, res) => {
            handleError(() => {
                res.json(this.crudService.template());
            }, res);
        });

        if (process.env.DEBUG)
            console.log(`${this.singularName} (new): curl -X GET http://localhost:${process.env.WEB_PORT}${url}`);
    }

    /**
     * @function _create
     * @description Define the create route for creating a new resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _create() {
        const url = `/${this.singularName}`;
        const auth = this.auth._create ? AuthMiddleware : [];

        this.router.post(url, auth, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.create(req.body);
                res.json(data);
            }, res);
        });

        if (process.env.DEBUG)
            console.log(`${this.singularName} (create): curl -X POST http://localhost:${process.env.WEB_PORT}${url}`);
    }

    /**
     * @function _show
     * @description Define the show route for getting a single resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _show() {
        const url = `/${this.singularName}/:${this.pk}`;
        const auth = this.auth._show ? AuthMiddleware : [];

        this.router.get(url, auth, (req, res) => {
            handleError(async () => {
                const data = await this.crudService.findOne(req.params[this.pk]);
                res.json(data);
            }, res);
        });

        if (process.env.DEBUG)
            console.log(`${this.singularName} (show): curl -X GET http://localhost:${process.env.WEB_PORT}${url}`);
    }

    /**
     * @function _edit
     * @description Define the edit route for getting a resource template for editing
     * @returns {undefined}
     * @memberof BaseController
     */
    _update() {
        const url = `/${this.singularName}/:${this.pk}`;
        const auth = this.auth._update ? AuthMiddleware : [];

        this.router.patch(url, auth, (req, res) => {
            handleError(async () => {
                await this.crudService.update(req.params[this.pk], req.body);

                res.status(204).json();
            }, res);
        });

        if (process.env.DEBUG)
            console.log(`${this.singularName} (update): curl -X PATCH http://localhost:${process.env.WEB_PORT}${url}`);
    }

    /**
     * @function _destroy
     * @description Define the destroy route for deleting a resource
     * @returns {undefined}
     * @memberof BaseController
     */
    _destroy() {
        const url = `/${this.singularName}/:${this.pk}`;
        const auth = this.auth._destroy ? AuthMiddleware : []

        this.router.delete(url, auth, (req, res) => {
            handleError(async () => {
                await this.crudService.destroy(req.params[this.pk])

                res.status(204).json();
            }, res);
        });

        if (process.env.DEBUG)
            console.log(`${this.singularName} (destroy): curl -X DELETE http://localhost:${process.env.WEB_PORT}${url}`);
    }

    defineCustomRoute(method, url, callback) {
        handleError(() => {
            this.router[method](url, callback);
        });

        if (process.env.DEBUG)
            console.log(`Custom Route (${method}): curl -X ${method.toUpperCase()} http://localhost:${process.env.WEB_PORT}${url}`);
    }
}

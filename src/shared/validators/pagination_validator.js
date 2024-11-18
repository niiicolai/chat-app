import ControllerError from '../errors/controller_error.js';

export default (options = { page: null, limit: null }) => {
    if (options.page && isNaN(options.page)) throw new ControllerError(400, 'page must be a number');
    if (options.page && options.page < 1) throw new ControllerError(400, 'page must be greater than 0');
    if (options.limit && options.limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
    if (options.limit && isNaN(options.limit)) throw new ControllerError(400, 'limit must be a number');
    if (options.page && !options.limit) throw new ControllerError(400, 'page requires limit');

    if (options.limit) options.limit = parseInt(options.limit);
    if (options.page) options.page = parseInt(options.page);
    if (options.page && options.limit) options.offset = (options.page - 1) * options.limit;

    return options;
};

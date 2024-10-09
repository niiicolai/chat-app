import fs from "fs";

// Find all controllers in the current directory
const files = fs.readdirSync(__dirname);
const controllers = files
    .filter(file => file.endsWith('_controller.js'))
    .map(file => require(`./${file}`).default);

/**
 * @constant apiPrefix
 * @description Prefix prepended to all MongoDB API routes
 * @type {string}
 */
const apiPrefix = '/api/v1/mongodb';

/**
 * @function mongodbControllers
 * @description Register all MongoDB controllers to express app
 * @param {Express} app - Express app
 * @returns {void}
 */
export default (app) => {
    for (const controller of controllers) {
        app.use(apiPrefix, controller);
    }
}

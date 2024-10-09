import fs from "fs";
import path from "path";
import { pathToFileURL } from 'url';

/**
 * @function mongodbControllers
 * @description Register all MongoDB controllers to express app
 * @param {Express} app - Express app
 * @returns {void}
 */
export default (app) => {
    const dir = path.resolve('src', 'document-based', 'controllers');
    fs.readdirSync(dir)
        .filter(file => file.endsWith('_controller.js'))
        .forEach(async file => {
            try {
                const fileDir = path.join(dir, file);
                const filePath = pathToFileURL(fileDir);
                const controller = await import(filePath.href);
                app.use('/api/v1/mongodb', controller.default);
            } catch (error) {
                console.error('_mongodb_controllers.js', error);
            }
        })
}

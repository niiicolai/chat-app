import fs from "fs";
import path from "path";
import { pathToFileURL } from 'url';

/**
 * @function mysqlControllers
 * @description Register all MySQL controllers to express app
 * @param {Express} app - Express app
 * @returns {void}
 */
export default (app) => {
    const dir = path.resolve('src', 'relational-based', 'controllers');
    fs.readdirSync(dir)
        .filter(file => file.endsWith('_controller.js'))
        .forEach(async file => {
            try {
                const fileDir = path.join(dir, file);
                const filePath = pathToFileURL(fileDir);
                const controller = await import(filePath.href);
                app.use('/api/v1/mysql', controller.default);
            } catch (error) {
                console.error('_mysql_controllers.js', error);
            }
        })
}

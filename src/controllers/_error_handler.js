import ControllerError from '../errors/controller_error.js';
import rollbar from '../../rollbar.js';

export default async (res, c) => {
    try {
        await c();
    } catch (error) {
        if (error instanceof ControllerError) {
            res.status(error.code).json(error.message);
        } else {
            rollbar.error(error);
            console.log(error);
            res.status(500).json('Internal Server Error');
        }
    }
}

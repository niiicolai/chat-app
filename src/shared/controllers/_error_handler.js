import ControllerError from '../errors/controller_error.js';
import rollbar from '../../../rollbar.js';

export default async (res, c) => {
    if (typeof c !== 'function') console.log('Error Handler: c is not a function');

    try {
        await c();
    } catch (error) {
        if (error instanceof ControllerError) {
            if (error.code === 500) {
                rollbar.error(error);
                console.log(error);
                res.status(500).json('Internal Server Error');
                return;
            }

            res.status(error.code).json(error.message);
        } else {
            rollbar.error(error);
            console.log(error);
            res.status(500).json('Internal Server Error');
        }
    }
}

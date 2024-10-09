import docsController from "./docs_controller.js";
import channelController from "./channel_controller.js";

const controllers = [
    channelController
];

export const useWebsocketControllers = (connection, type, payload) => {
    for (const events of controllers) {
        if (events[type]) {
            events[type](connection, payload);
            break;
        }
    }
}

export default (app) => {
    app.use(docsController)
}

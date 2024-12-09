import 'dotenv/config'
import { useWebsocketControllers } from './src/shared/websocket/controllers/_websocket_controllers.js';
import WebSocketServer from 'websocket';
import http from 'http';

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
const web_port = process.env.WEB_PORT || 3000
const port = process.env.WEBSOCKET_PORT || 3001;
const requestListeners = (req, res) => {
    res.writeHead(404)
    res.end()
}

const server = http.createServer(requestListeners);

server.listen(port, () => {
    console.log(`INFO: WebSocket Server is listening on port ${port}`);
    console.log(`INFO: Websocket API docs: http://localhost:${web_port}/websocket/api-docs`);
});

const wsServer = new WebSocketServer.server({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    return true;
}

export function broadcastChannel(channel, type, payload, user_uuid) {
    console.log(`INFO: Broadcasting to channel ${channel}: ${type}`);

    wsServer.connections.forEach((connection) => {
        if (connection.userData?.user?.sub !== user_uuid && connection.userData.channel === channel) {
            console.log(`Sending to ${connection.userData.user}: ${type}`);
            connection.sendUTF(JSON.stringify({ type, payload }));
        }
    });
};

wsServer.on('request', (request) => {

    if (!originIsAllowed(request.origin)) {
        request.reject();
        return;
    }

    try {
        const connection = request.accept('echo-protocol', request.origin);
        connection.userData = { user: null, channel: null };
        connection.on('message', function (message) {
            if (message.type === 'utf8') {
                const json = JSON.parse(message.utf8Data);
                useWebsocketControllers(connection, json.type, json);
            }
        });

        connection.on('close', (reasonCode, description) => {});
    } catch (error) {
        console.error(error);
    }

});

export default server;

import jwtService from './services/jwt_service.js';
import WebSocketServer from 'websocket';
import http from 'http';

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
const port = process.env.WEBSOCKET_PORT || 3001;
const server = http.createServer((request, response) => {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(port, () => {
    console.log((new Date()) + ` WebSocket Server is listening on port ${port}`);
});

const wsServer = new WebSocketServer.server({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    return allowedOrigins.includes(origin);
}

const joinChannel = (client, json) => {
    const channel = json.channel;
    const user = jwtService.getUserFromToken({ authorization: json.token });
    if (!user) {
        console.log(new Date() + ` Peer ${client.remoteAddress} unauthorized`);
        client.sendUTF(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }
    client.userData = { user, channel };
    console.log((new Date()) + ` Peer ${user.sub} joined channel ${channel}`);
};

const leaveChannel = (client) => {
    client.userData = { user: null, channel: null };
    console.log((new Date()) + ` Peer ${client.remoteAddress} left channel`);
};

wsServer.on('request', (request) => {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    try {
        const connection = request.accept('echo-protocol', request.origin);
        console.log((new Date()) + ' Connection accepted.');

        connection.userData = { user: null, channel: null };
        connection.on('message', function (message) {

            if (message.type === 'utf8') {
                const json = JSON.parse(message.utf8Data);
                switch (json.type) {
                    case 'join_channel':
                        joinChannel(connection, json);
                        break;
                    case 'leave_channel':
                        leaveChannel(connection);
                        break;
                }
            }
        });

        connection.on('close', (reasonCode, description) => {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    } catch (error) {
        console.error(error);
    }

});

export const broadcastChannel = (channel, message) => {
    wsServer.connections.forEach((connection) => {
        if (connection.userData.channel === channel) {
            connection.sendUTF(JSON.stringify({ type: 'chat_message', message}));
        }
    });
};

export default server;

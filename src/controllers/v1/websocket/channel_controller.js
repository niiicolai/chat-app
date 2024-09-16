import jwtService from "../../../services/jwt_service.js";

const controller = {};

controller.join_channel = (connection, payload) => {
    const { channel, token } = payload;

    if (!channel) {
        connection.sendUTF(JSON.stringify({ error: 'Missing channel' }));
        return;
    }

    if (!token) {
        connection.sendUTF(JSON.stringify({ error: 'Missing token' }));
        return;
    }

    const user = jwtService.getUserFromToken({ authorization: json.token });
    if (!user) {
        client.sendUTF(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    client.userData = { user, channel };

    if (process.env.DEBUG === 'true') 
        console.log((new Date()) + ` Peer ${user.sub} joined channel ${channel}`);
}

controller.leave_channel = (connection) => {
    connection.userData = { user: null, channel: null };
    if (process.env.DEBUG === 'true') 
        console.log((new Date()) + ` Peer ${connection.remoteAddress} left channel`);
}

export default controller;

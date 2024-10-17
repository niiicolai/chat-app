import jwtService from "../../services/jwt_service.js";

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

    const user = jwtService.verifyAndDecodeHTTPHeader({ authorization: token });
    if (!user) {
        connection.sendUTF(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    connection.userData = { user, channel };
    if (process.env.DEBUG === 'true') 
        console.log((new Date()) + ` Peer ${user.sub} joined channel ${channel}`);

    connection.sendUTF(JSON.stringify({ type: 'joined_channel', payload: { channel } }));
}

controller.leave_channel = (connection) => {
    connection.userData = { user: null, channel: null };
    if (process.env.DEBUG === 'true') 
        console.log((new Date()) + ` Peer ${connection.remoteAddress} left channel`);
}

export default controller;

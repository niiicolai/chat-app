import jwtService from "../../services/jwt_service.js";
import MySQlRoomPermissionService from "../../../relational-based/services/room_permission_service.js";
import MongoDBRoomPermissionService from "../../../document-based/services/room_permission_service.js";
import Neo4jRoomPermissionService from "../../../graph-based/services/room_permission_service.js";

const controller = {};
const supportedDatabases = ['mysql', 'mongodb', 'neo4j'];

controller.join_channel = async (connection, payload) => {
    const { channel, token, db } = payload;

    if (!channel) {
        connection.sendUTF(JSON.stringify({ error: 'Missing channel' }));
        return;
    }
    if (!token) {
        connection.sendUTF(JSON.stringify({ error: 'Missing token' }));
        return;
    }
    if (!db) {
        connection.sendUTF(JSON.stringify({ error: 'Missing db' }));
        return;
    }

    if (!supportedDatabases.includes(db)) {
        connection.sendUTF(JSON.stringify({ error: 'Unsupported database. Supported databases: ' + supportedDatabases.join(', ') }));
        return;
    }

    const user = jwtService.verifyAndDecodeHTTPHeader({ authorization: token });
    if (!user) {
        connection.sendUTF(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    // Ensure channel starts with 'channel-'
    if (!channel.startsWith('channel-')) {
        connection.sendUTF(JSON.stringify({ error: 'Invalid channel. Channel must start with "channel-"' }));
        return;
    }

    // Ensure user only can join the room if he/she is in the room
    const channel_uuid = channel.replace('channel-', '');
    if (db === 'mysql' && !(await MySQlRoomPermissionService.isInRoomByChannel({ channel_uuid, user }))) {
        connection.sendUTF(JSON.stringify({ error: 'User is not in the room' }));
        return;
    } else if (db === 'mongodb' && !(await MongoDBRoomPermissionService.isInRoomByChannel({ channel_uuid, user }))) {
        connection.sendUTF(JSON.stringify({ error: 'User is not in the room' }));
        return;
    } else if (db === 'neo4j' && !(await Neo4jRoomPermissionService.isInRoomByChannel({ channel_uuid, user }))) {
        connection.sendUTF(JSON.stringify({ error: 'User is not in the room' }));
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

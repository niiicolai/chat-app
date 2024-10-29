import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_file_dto.js';
import neo4j from 'neo4j-driver';

const storage = new StorageService('room_file');

console.error('TODO: Implement destroy method in room_file_service');

class Service {

    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { user, uuid } = options;
        
        const roomFileInstance = await neodeInstance.model('RoomFile').find(uuid);
        if (!roomFileInstance) throw new ControllerError(404, 'Room file not found');

        const room = roomFileInstance.get('room').endNode().properties();
        if (!room) throw new ControllerError(404, 'Room not found');

        const roomFileType = roomFileInstance.get('room_file_type').endNode().properties();
        if (!roomFileType) throw new ControllerError(404, 'Room file type not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(roomFileInstance.properties(), [{ room }, { roomFileType }]);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { room_uuid, user } = options;
        let { page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');
        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        const props = { room_uuid };
        let cypher = 
            `MATCH (rf:RoomFile)-[:HAS_ROOM]->(r:Room { uuid: $room_uuid }) ` +
            `MATCH (rf)-[:HAS_ROOM_FILE_TYPE]->(ct:RoomFileType) ` +
            `OPTIONAL MATCH (cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf) ` +
            `OPTIONAL MATCH (cmu)-[:HAS_CHANNEL_MESSAGE_UPLOAD_TYPE]->(cmt) ` +
            `OPTIONAL MATCH (cm:ChannelMessage)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu) ` +
            `OPTIONAL MATCH (u:User)-[:HAS_CHANNEL_MESSAGE]->(cm) ` +
            `ORDER BY rf.created_at DESC`

        if (page && limit) {
            cypher += ' SKIP $skip LIMIT $limit';
            props.skip = neo4j.int((page - 1) * limit);
            props.limit = neo4j.int(limit);
        }

        if (!page && limit) {
            cypher += ' LIMIT $limit';
            props.limit = neo4j.int(limit);
        }

        cypher += ` RETURN rf, r, ct, cmu, cmt, cm, u`;

        const dbResult = await neodeInstance.cypher(cypher, props);
        const data = dbResult.records.map(record => {
            const rf = record.get('rf').properties;
            const rel = [];
            if (record.get('r')) rel.push({ room: record.get('r').properties });
            if (record.get('ct')) rel.push({ roomFileType: record.get('ct').properties });
            if (record.get('u')) rel.push({ user: record.get('u').properties });
            if (record.get('cmu')) rel.push({ channelMessageUpload: record.get('cmu').properties });
            if (record.get('cmt')) rel.push({ channelMessageUploadType: record.get('cmt').properties });
            if (record.get('cm')) rel.push({ channelMessage: record.get('cm').properties });
            return dto(rf, rel);
        });
        const count = await neodeInstance.cypher(
            `MATCH (rf:RoomFile)-[:HAS_ROOM]->(r:Room { uuid: $room_uuid }) ` +
            `RETURN COUNT(rf) AS count`, { room_uuid }
        );
        const total = count.records[0].get('count').low;
        const result = { data, total };

        if (page && limit) {
            result.page = page;
            result.pages = Math.ceil(total / limit);
        }

        if (limit) result.limit = limit;

        return result;
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        
        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await RoomFile.findOne({ uuid })
            .populate('room')
            .populate('room_file_type');
        if (!existing) {
            throw new ControllerError(404, 'Room file not found');
        }

        const isMessageUpload = existing.room_file_type.name === 'ChannelMessageUpload';

        if (isMessageUpload &&
            !this.isOwner({ uuid, user }) &&
            !(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the file, or an admin or moderator of the room');
        }

        if (isMessageUpload) {
            const channelMessageUpload = await ChannelMessageUpload.findOne({ room_file: existing._id });
            if (!channelMessageUpload) throw new ControllerError(404, 'Channel message upload not found');
            const channelMessage = await ChannelMessage.findOne({ channel_message_upload: channelMessageUpload._id });
            if (!channelMessage) throw new ControllerError(404, 'Channel message not found');

            await ChannelMessage.findOne({ uuid: channelMessage.uuid }).updateOne({ channel_message_upload: null });
            await ChannelMessageUpload.deleteOne({ uuid: channelMessageUpload.uuid });
        }
        else if (existing.room_file_type.name === 'ChannelWebhookAvatar') {
            await ChannelWebhook.findOne({ room_file: existing._id }).updateOne({ room_file: null });
        }
        else if (existing.room_file_type.name === 'ChannelAvatar') {
            await Channel.findOne({ room_file: existing._id }).updateOne({ room_file: null });
        }
        else if (existing.room_file_type.name === 'RoomAvatar') {
            await RoomAvatar.findOne({ room_file: existing._id }).updateOne({ room_file: null });
        }
       
        await RoomFile.deleteOne({ uuid });

        /**
         * Delete the file from storage as well
         */
        const key = storage.parseKey(existing.src);
        storage.deleteFile(key);
    }

    async isOwner(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!uuid) throw new ControllerError(400, 'isOwner: No uuid provided');
        if (!user_uuid) throw new ControllerError(500, 'isOwner: No user provided');

        // Find the channel message upload related to the room file with the given uuid
        const channelMessageUpload = await ChannelMessageUpload.findOne({ 'room_file.uuid': uuid }).populate('channel_message');
        if (!channelMessageUpload) throw new ControllerError(404, 'isOwner: Channel message upload not found');

        // Find the channel message related to the channel message upload and populate the user field
        const channelMessage = await ChannelMessage.findOne({ uuid: channelMessageUpload.channel_message.uuid }).populate('user');
        if (!channelMessage) throw new ControllerError(404, 'isOwner: Channel message not found');

        return channelMessage.user.uuid === user_uuid;
    }
};

const service = new Service();

export default service;

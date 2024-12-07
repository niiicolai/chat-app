import Validator from '../../shared/validators/room_file_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_file_dto.js';
import neo4j from 'neo4j-driver';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('room_file');

/**
 * @class RoomFileService
 * @description Service class for room files
 * @exports RoomFileService
 */
class RoomFileService {

    /**
     * @function findOne
     * @description Find a room file by uuid
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { user, uuid } = options;

        const roomFile = await neodeInstance.model('RoomFile').find(uuid);
        if (!roomFile) throw new err.EntityNotFoundError('room_file');

        const room = roomFile.get('room').endNode().properties();
        const roomFileType = roomFile.get('room_file_type').endNode().properties();

        const isInRoom = await RPS.isInRoom({ room_uuid: room.uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({ ...roomFile.properties(), room, roomFileType });
    }

    /**
     * @function findAll
     * @description Find all room files in a room
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.cypher(
            'MATCH (rf:RoomFile)-[:STORED_IN]->(r:Room { uuid: $room_uuid }) ' +
            'MATCH (rf)-[:TYPE_IS]->(rft:RoomFileType) ' +
            'OPTIONAL MATCH (cmu:ChannelMessageUpload)-[:SAVED_AS]->(rf) ' +
            'OPTIONAL MATCH (cm:ChannelMessage)-[:UPLOAD_IS]->(cmu) ' +
            'OPTIONAL MATCH (cmu)-[:WRITTEN_BY]->(u:User) ' +
            'ORDER BY rf.created_at DESC ' +
            'RETURN rf, rft, r, cmu, cm, u, COUNT(rf) AS total',
            {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
                room_uuid,
            }
        );

        const total = result.records[0].get('total').low;
        return {
            total,
            data: result.records.map(record => dto({
                ...record.get('rf').properties,
                room: record.get('r').properties,
                roomFileType: record.get('rft').properties,
                channelMessageUpload: record.get('cmu') ? record.get('cmu').properties : null,
                channelMessage: record.get('cm') ? record.get('cm').properties : null,
                user: record.get('u') ? record.get('u').properties : null,
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function destroy
     * @description Delete a room file
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {boolean} bypassStorage optional
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }, bypassStorage = false) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const roomFile = await neodeInstance.model('RoomFile').find(uuid);
        if (!roomFile) throw new err.EntityNotFoundError('room_file');

        const room = roomFile.get('room').endNode().properties();
        const src = roomFile.properties().src;

        const [owner, admin, moderator] = await Promise.all([
            this.isOwner({ uuid, user }),
            RPS.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' }),
            RPS.isInRoom({ room_uuid: room.uuid, user, role_name: 'Moderator' })
        ]);

        if (!owner && !admin && !moderator) {
            throw new err.OwnershipOrLeastModRequiredError("room_file");
        }
        
        const session = neodeInstance.session();
        session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (rf:RoomFile { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf) ` +
                `DETACH DELETE rf, cmu`,
                { uuid }
            );

            if (!bypassStorage) {
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }
        });
    }

    /**
     * @function isOwner
     * @description Check if a user is the owner of a room file
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<boolean>}
     */
    async isOwner(options = { uuid: null, user: null }) {
        Validator.isOwner(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessageUpload = await neodeInstance.cypher(
            `MATCH (cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf:RoomFile { uuid: $uuid }) ` +
            `OPTIONAL MATCH (cm:ChannelMessage)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu) ` +
            `OPTIONAL MATCH (u:User)-[:HAS_CHANNEL_MESSAGE]->(cm) ` +
            `RETURN cmu, cm, u`, { uuid }
        );

        if (!channelMessageUpload.records.length) return false;
        if (!channelMessageUpload.records[0].get('u')) return false;

        return channelMessageUpload.records[0].get('u').properties.uuid === user_uuid;
    }
};

const service = new RoomFileService();

export default service;

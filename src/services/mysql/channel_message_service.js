import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import { broadcastChannel } from '../../../websocket_server.js';

const service = new MysqlBaseFindService(
    db.ChannelMessageView,
    (m) => {
        const res = {
            uuid: m.channel_message_uuid,
            body: m.channel_message_body,
            channel_message_type_name: m.channel_message_type_name,
            channel_uuid: m.channel_uuid,
            room_uuid: m.room_uuid,
            created_at: m.channel_message_created_at,
            updated_at: m.channel_message_updated_at,

        };
        
        if (m.channel_message_upload_uuid) {
            res.channel_message_upload = {};
            res.channel_message_upload.uuid = m.channel_message_upload_uuid;
            res.channel_message_upload.channel_message_upload_type_name = m.channel_message_upload_type_name;
            
            if (m.room_file_uuid) {
                res.channel_message_upload.room_file = {};
                res.channel_message_upload.room_file.uuid = m.room_file_uuid;
                res.channel_message_upload.room_file.src = m.room_file_src;
                res.channel_message_upload.room_file.room_file_type_name = m.room_file_type_name;
                res.channel_message_upload.room_file.size_bytes = m.room_file_size;
                res.channel_message_upload.room_file.size_mb = parseFloat(m.room_file_size_mb);
            }
        }

        if (m.user_uuid) {
            res.user = {};
            res.user.user_uuid = m.user_uuid;
            res.user.user_username = m.user_username;
            res.user.user_avatar = m.user_avatar_src;
        }

        return res;
    }
);

service.create = async (options={ body: null, file: null, user: null }) => {
    const { body, file, user } = options;
    const { uuid, name, description, channel_type_name, room_uuid } = body;
    if (!body) {
        throw new ControllerError(400, 'No body provided');
    }
    
    if (!uuid) {
        throw new ControllerError(400, 'No UUID provided');
    }
    if (!name) {
        throw new ControllerError(400, 'No name provided');
    }
    if (!description) {
        throw new ControllerError(400, 'No description provided');
    }
    if (!channel_type_name) {
        throw new ControllerError(400, 'No channel_type_name provided');
    }

    if (file) {
        body.src = await storage.uploadFile(file, uuid);
        body.bytes = file.size;
    }

    await db.sequelize.query('CALL create_channel_proc(:uuid, :name, :description, :channel_type_name, :bytes, :upload_src, :room_uuid, @result)', {
        replacements: {
            uuid,
            name,
            description,
            channel_type_name,
            bytes: body.bytes || null,
            upload_src: body.src || null,
            room_uuid,
        },
    });

    const ch = await service.findOne({ channel_uuid, user });

    /**
      * Broadcast the channel message to all users
      * in the room where the channel message was created.
      */
    broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', ch);

    return ch;
};

service.update = async (options={ channel_uuid: null, body: null, file: null, user: null }) => {
    const { channel_uuid, body, file, user } = options;
    const { name, description } = body;

    if (!channel_uuid) {
        throw new ControllerError(400, 'No channel_uuid provided');
    }

    const existing = await service.model.findOne({ where: { channel_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Channel not found');
    }

    if (!name) {
        body.name = existing.channel_name;
    }

    if (!description) {
        body.description = existing.channel_description;
    }

    body.channel_type_name = existing.channel_type_name;

    if (file) {
        body.src = await storage.uploadFile(file, room_uuid);
        body.bytes = file.size;
    } else {
        body.src = existing.room_file_src;
        body.bytes = existing.room_file_size;
    }

    await db.sequelize.query('CALL edit_channel_proc(:channel_uuid, :name, :description, :channel_type_name, :src, :bytes, :room_uuid, @result)', {
        replacements: {
            channel_uuid,
            name: body.name,
            description: body.description,
            channel_type_name: body.channel_type_name,
            src: body.src || null,
            bytes: body.bytes  || null,
            room_uuid: channel.room_uuid,
        },
    });

    const ch = await service.findOne({ channel_uuid, user });

    /**
      * Broadcast the channel message to all users
      * in the room where the channel message was updated.
      */
    broadcastChannel(`channel-${channel_uuid}`, 'chat_message_updated', ch);

    return ch;
};

service.destroy = async (options={ channel_uuid: null, user: null }) => {
    const { channel_uuid, user } = options;
    const { sub: user_uuid } = user;

    if (!channel_uuid) {
        throw new ControllerError(400, 'No channel_uuid provided');
    }

    const existing = await service.model.findOne({ where: { channel_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Channel not found');
    }

    await db.sequelize.query('CALL delete_channel_proc(:channel_uuid, @result)', {
        replacements: {
            channel_uuid,
        },
    });

    /**
      * Broadcast the channel message to all users
      * in the room where the channel message was deleted.
      */
    broadcastChannel(`channel-${channel_uuid}`, 'chat_message_deleted', { channel_uuid });
};

export default service;

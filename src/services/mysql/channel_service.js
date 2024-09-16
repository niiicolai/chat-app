import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.ChannelView,
    (m) => {
        const res = {
            uuid: m.channel_uuid,
            name: m.channel_name,
            description: m.channel_description,
            channel_type_name: m.channel_type_name,
            created_at: m.channel_created_at,
            updated_at: m.channel_updated_at,
            room_uuid: m.room_uuid,
        };
        if (m.room_file_uuid) {
            res.room_file = {};
            res.room_file.uuid = m.room_file_uuid;
            res.room_file.src = m.room_file_src;
            res.room_file.room_file_type_name = m.room_file_type_name;
            res.room_file.size_bytes = m.room_file_size;
            res.room_file.size_mb = parseFloat(m.room_file_size_mb);
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

    return await service.findOne({ channel_uuid: body.uuid, user });
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

    return await service.findOne({ channel_uuid, user });
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
};

export default service;

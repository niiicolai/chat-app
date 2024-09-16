import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomView,
    (m) => {
        const res = {
            uuid: m.room_uuid,
            name: m.room_name,
            description: m.room_description,
            room_category_name: m.room_category_name,
        };

        res.joinSettings = {
            channelUuid: m.join_channel_uuid,
            message: m.join_message,
        };

        res.rulesSettings = {
            text: m.rules_text,
        };

        res.userSettings = {
            maxUsers: m.max_users,
        };

        res.channelSettings = {
            maxChannels: m.max_channels,
            messagesDaysToLive: m.message_days_to_live,
        };

        res.fileSettings = {
            totalFilesBytesAllowed: m.total_files_bytes_allowed,
            singleFileBytesAllowed: m.single_file_bytes_allowed,
            fileDaysToLive: m.file_days_to_live,
            totalFilesMb: parseFloat(m.total_files_mb),
            singleFileMb: parseFloat(m.single_file_mb),
        };

        if (m.room_avatar_uuid) {
            res.avatar = {
                uuid: m.room_avatar_uuid,
            };

            if (m.room_file_uuid) {
                res.avatar.room_file = {
                    uuid: m.room_file_uuid,
                    src: m.room_file_src,
                    room_file_type_name: m.room_file_type_name,
                    size: parseFloat(m.room_file_size),
                    sizeMb: parseFloat(m.room_file_size_mb),
                };
            }
        }

        return res;
    }
);

service.create = async (options={ body: null, user: null }) => {
    if (!options.body) {
        throw new ControllerError(400, 'No body provided');
    }
    
    const { body, file } = options;
    
    if (!body.uuid) {
        throw new ControllerError(400, 'No UUID provided');
    }
    if (!body.name) {
        throw new ControllerError(400, 'No name provided');
    }
    if (!body.description) {
        throw new ControllerError(400, 'No description provided');
    }
    if (!body.room_category_name) {
        throw new ControllerError(400, 'No room_category_name provided');
    }

    if (file) {
        body.src = await storage.uploadFile(file, body.uuid);
        body.bytes = file.size;
    }
    
    await db.sequelize.query('CALL create_room_proc(:user_uuid, :room_uuid, :name, :description, :room_category_name, :room_user_role, :src, :bytes, @result)', {
        replacements: {
            user_uuid: user.sub,
            room_uuid: body.uuid,
            name: body.name,
            description: body.description,
            room_category_name: body.room_category_name,
            room_user_role: "Admin",
            src: body.src || null,
            bytes: body.bytes  || null,
        },
    });

    return await service.findOne({ room_uuid: body.uuid });
};

service.update = async (options={ room_uuid: null, body: null, user: null }) => {
    const { room_uuid, body, file, user } = options;
    const { name, description, room_category_name } = body;
    const { sub: user_uuid } = user;

    if (!room_uuid) {
        throw new ControllerError(400, 'No room_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room not found');
    }

    if (!name) {
        body.name = existing.room_name;
    }

    if (!description) {
        body.description = existing.room_description;
    }

    if (!room_category_name) {
        body.room_category_name = existing.room_category_name;
    }

    if (file) {
        body.src = await storage.uploadFile(file, room_uuid);
        body.bytes = file.size;
    } else {
        body.src = existing.room_file_src;
        body.bytes = existing.room_file_size;
    }

    await db.sequelize.query('CALL edit_room_proc(:room_uuid, :name, :description, :room_category_name, :src, :bytes, @result)', {
        replacements: {
            room_uuid,
            name: body.name,
            description: body.description,
            room_category_name: body.room_category_name,
            src: body.src || null,
            bytes: body.bytes  || null,
        },
    });

    return await service.findOne({ room_uuid });
};

service.destroy = async (options={ room_uuid: null, user: null }) => {
    const { room_uuid, user } = options;
    const { sub: user_uuid } = user;

    if (!room_uuid) {
        throw new ControllerError(400, 'No room_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room not found');
    }

    await db.sequelize.query('CALL delete_room_proc(:room_uuid, @result)', {
        replacements: {
            room_uuid,
        },
    });
};

service.removeRoomAvatar = async (options={ room_uuid: null, user: null }) => {
    const { room_uuid, user } = options;
    const { sub: user_uuid } = user;

    if (!room_uuid) {
        throw new ControllerError(400, 'No room_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room not found');
    }

    await db.sequelize.query('CALL delete_room_avatar_proc(:room_uuid, @result)', {
        replacements: {
            room_uuid,
        },
    });
};

service.editJoinSettings = async (options={ room_uuid: null, body: null, user: null }) => {
    const { room_uuid, body, user } = options;
    const { sub: user_uuid } = user;
    const { join_message } = body;
    if (!room_uuid) {
        throw new ControllerError(400, 'No room_uuid provided');
    }

    if (!join_message) {
        body.join_message = existing.join_message;
    }

    const existing = await service.model.findOne({ where: { room_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room not found');
    }

    await db.sequelize.query('CALL edit_room_join_setting_proc(:room_uuid, :join_message, :join_channel_uuid, @result)', {
        replacements: {
            room_uuid,
            join_message: body.join_message,
            join_channel_uuid: body.join_channel_uuid,
        },
    });
};

service.leave = async (options={ room_uuid: null, user: null }) => {
    const { room_uuid, user } = options;
    const { sub: user_uuid } = user;

    if (!room_uuid) {
        throw new ControllerError(400, 'No room_uuid provided');
    }

    if (!user_uuid) {
        throw new ControllerError(400, 'No user_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room not found');
    }

    await db.sequelize.query('CALL leave_room_proc(:user_uuid, :room_uuid, @result)', {
        replacements: {
            user_uuid,
            room_uuid,
        },
    });
};

export default service;

import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import dto from '../../dto/user_status_dto.js';

class Service {
    constructor() {
        this.dto = (m) => dto(m, 'user_status_');
        this.model = db.UserStatusView;
    }

    async findOne(options = { user_uuid: null }) {
        const { user_uuid } = options;
        if (!user_uuid) {
            throw new ControllerError(400, 'No user_uuid provided');
        }

        const status = await db.UserStatusView.findOne({ where: { user_uuid } });
        if (!status) {
            throw new ControllerError(404, 'User status not found');
        }

        return this.dto(status);
    }

    async update(options={ body: null, user_uuid: null }) {
        const { body, user_uuid } = options;
        let { message, user_status_state } = body;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await db.UserStatusView.findOne({ where: { user_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'User status not found');
        }

        if (!message) {
            message = existing.user_status_message;
        }
        
        if (!user_status_state) {
            user_status_state = existing.user_status_state;
        }

        await db.sequelize.query('CALL update_user_status_proc(:user_uuid, :user_status_state, :message, :last_seen_at, :total_online_time, @result)', {
            replacements: {
                user_uuid,
                user_status_state,
                message,
                last_seen_at: existing.last_seen_at,
                total_online_time: existing.total_online_time,
            },
        });

        return await service.findOne({ user_uuid });
    }
}

const service = new Service();

export default service;

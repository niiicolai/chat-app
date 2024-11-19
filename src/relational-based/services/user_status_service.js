import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import UserStatusServiceValidator from '../../shared/validators/user_status_service_validator.js';
import dto from '../dto/user_status_dto.js';

class Service {
    constructor() {
        this.dto = dto;
        this.model = db.UserStatusView;
    }

    async findOne(options = { user_uuid: null }) {
        UserStatusServiceValidator.findOne(options);

        const { user_uuid } = options;
        const status = await db.UserStatusView.findOne({ where: { user_uuid } });
        if (!status) {
            throw new ControllerError(404, 'User status not found');
        }

        return this.dto(status);
    }

    async update(options={ body: null, user_uuid: null }) {
        UserStatusServiceValidator.update(options);

        const { body, user_uuid } = options;
        let { message, user_status_state } = body;

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

        await db.sequelize.query('CALL update_user_status_proc(:user_uuid, :user_status_state, :message, :last_seen_at, :user_status_total_online_hours, @result)', {
            replacements: {
                user_uuid,
                user_status_state,
                message,
                last_seen_at: existing.user_status_last_seen_at,
                user_status_total_online_hours: existing.user_status_total_online_hours,
            },
        });

        return await service.findOne({ user_uuid });
    }
}

const service = new Service();

export default service;

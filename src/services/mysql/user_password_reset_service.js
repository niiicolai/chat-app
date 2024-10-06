import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';

const service = new MysqlBaseFindService(
    db.UserPasswordResetView,
    (m) => {
        return {
            uuid: m.user_password_reset_uuid,
            expires_at: m.user_password_reset_expires_at,
            user_uuid: m.user_uuid,
            created_at: m.user_password_reset_created_at,
            updated_at: m.user_password_reset_updated_at,
        };
    }
);

import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';

const service = new MysqlBaseFindService(
    db.UserEmailVerificationView,
    (m) => {
        return {
            uuid: m.user_email_verification_uuid,
            user_uuid: m.user_uuid,
            created_at: m.user_email_verification_created_at,
            updated_at: m.user_email_verification_updated_at,
        };
    }
);

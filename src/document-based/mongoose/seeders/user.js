import User from '../models/user.js';
import UserEmailVerification from '../models/user_email_verification.js';
import UserPasswordReset from '../models/user_password_reset.js';
import UserStatus from '../models/user_status.js';
import UserStatusState from '../models/user_status_state.js';
import UserLogin from '../models/user_login.js';
import UserLoginType from '../models/user_login_type.js';
import { v4 as uuidv4 } from 'uuid';

import data from './data.js';

const userEmailVerificationUuid1 = "563bae61-9b96-48e8-81b6-6691934f7d67";
const userEmailVerificationUuid2 = "b787b970-6e59-4c58-a9f7-a48a4fc6bcf3";
const userEmailVerificationUuid3 = "0c59510d-5a7a-40ee-a364-afc73369b09d";

const userStatus1Uuid = "3e1b6af2-6a44-455c-9602-77cbc480fa96";
const userStatus2Uuid = "d52ad730-5eb5-40d7-8fdc-bdf0a639a8f8";
const userStatus3Uuid = "f561a4c1-f0de-4abe-b109-2c27bdb55add";

const passwordResetUuid = "24abdccf-3acc-4559-89d4-c85118a4345f";

export default class UserSeeder {
    async up() {
        const user_login_type = await UserLoginType.findOne({ name: "Password" });
        const user_status_state = await UserStatusState.findOne({ name: "Offline" });

        await Promise.all([
            new User({
                ...data.users[0],
                user_email_verification: { 
                    uuid: userEmailVerificationUuid1, 
                    is_verified: true 
                },
                user_status: { 
                    uuid: userStatus1Uuid, 
                    last_seen_at: new Date(), 
                    message: "I'm back!", 
                    total_online_hours: 0, 
                    user_status_state 
                },
                user_logins: [{ 
                    uuid: uuidv4(), 
                    user_login_type, 
                    password: data.user_login.password 
                }],
                user_password_resets: [{ 
                    uuid: passwordResetUuid, 
                    expires_at: new Date() 
                }]
            }).save(),
            new User({
                ...data.users[1],
                user_email_verification: { 
                    uuid: userEmailVerificationUuid2, 
                    is_verified: true 
                },
                user_status: { 
                    uuid: userStatus2Uuid, 
                    last_seen_at: new Date(), 
                    message: "I'm back!", 
                    total_online_hours: 0, 
                    user_status_state 
                },
                user_logins: [{ 
                    uuid: uuidv4(), 
                    user_login_type, 
                    password: data.user_login.password 
                }],
                user_password_resets: [{ 
                    uuid: passwordResetUuid, 
                    expires_at: new Date() 
                }]
            }).save(),
            new User({
                ...data.users[2],
                user_email_verification: { 
                    uuid: userEmailVerificationUuid3, 
                    is_verified: true 
                },
                user_status: { 
                    uuid: userStatus3Uuid, 
                    last_seen_at: new Date(), 
                    message: "I'm back!", 
                    total_online_hours: 0, 
                    user_status_state 
                },
                user_logins: [{ 
                    uuid: uuidv4(), 
                    user_login_type, 
                    password: data.user_login.password 
                }],
                user_password_resets: [{ 
                    uuid: passwordResetUuid, 
                    expires_at: new Date() 
                }]
            }).save()
        ]);
    }

    async down() {
        await User.deleteMany({ uuid: { $in: data.users.map((d) => d.uuid) } });
    }
}

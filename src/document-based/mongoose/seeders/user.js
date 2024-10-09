import User from '../models/user.js';
import UserEmailVerification from '../models/user_email_verification.js';
import UserPasswordReset from '../models/user_password_reset.js';
import UserStatus from '../models/user_status.js';
import UserStatusState from '../models/user_status_state.js';

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
        const userEmailVerification1 = await new UserEmailVerification({ uuid: userEmailVerificationUuid1, is_verified: true }).save();
        const userEmailVerification2 = await new UserEmailVerification({ uuid: userEmailVerificationUuid2, is_verified: true }).save();
        const userEmailVerification3 = await new UserEmailVerification({ uuid: userEmailVerificationUuid3, is_verified: true }).save();
        
        const userStatusState = await UserStatusState.findOne({ name: "Offline" });
        const userStatus1 = await new UserStatus({ uuid: userStatus1Uuid, last_seen_at: new Date(), message: "I'm back!", total_online_hours: 0, user_status_state: userStatusState._id }).save();
        const userStatus2 = await new UserStatus({ uuid: userStatus2Uuid, last_seen_at: new Date(), message: "I'm back!", total_online_hours: 0, user_status_state: userStatusState._id }).save();
        const userStatus3 = await new UserStatus({ uuid: userStatus3Uuid, last_seen_at: new Date(), message: "I'm back!", total_online_hours: 0, user_status_state: userStatusState._id }).save();

        const user1 = await new User({
            ...data.users[0],
            user_email_verification: userEmailVerification1._id,
            user_status: userStatus1._id
        }).save();

        await new User({
            ...data.users[1],
            user_email_verification: userEmailVerification2._id,
            user_status: userStatus2._id
        }).save();

        await new User({
            ...data.users[2],
            user_email_verification: userEmailVerification3._id,
            user_status: userStatus3._id
        }).save();

        await new UserPasswordReset({ uuid: passwordResetUuid, user: user1._id, expires_at: new Date() }).save();
    }

    async down() {
        await UserPasswordReset.deleteMany({ uuid: passwordResetUuid });
        await User.deleteMany({ uuid: { $in: data.users.map((d) => d.uuid) } });
        await UserStatus.deleteMany({ uuid: { $in: [userStatus1Uuid, userStatus2Uuid, userStatus3Uuid] } });
        await UserEmailVerification.deleteMany({ uuid: { $in: [userEmailVerificationUuid1, userEmailVerificationUuid2, userEmailVerificationUuid3] } });
    }
}

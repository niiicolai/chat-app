import data from "./data.js";
import { v4 as uuidv4 } from 'uuid';

export default class UserSeeder {
    async up(neodeInstance) {
        const userStatusState = await neodeInstance.model('UserStatusState').find('Offline');
        const userLoginType = await neodeInstance.model('UserLoginType').find('Password');
        
        for (let state of data.users) {
            const userLogin = await neodeInstance.model('UserLogin').create({
                uuid: uuidv4(),
                password: data.user_login.password
            });

            const userState = await neodeInstance.model('UserStatus').create({
                last_seen_at: new Date(),
                message: "Hello, I'm new here!",
                total_online_hours: 0,
                created_at: new Date(),
                updated_at: new Date()
            });
            
            const userEmailVerification = await neodeInstance.model('UserEmailVerification').create({
                uuid: uuidv4(),
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            const userPasswordReset = await neodeInstance.model('UserPasswordReset').create({
                uuid: uuidv4(),
                expires_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            });
            
            const user = await neodeInstance.model('User').create({
                uuid: state.uuid,
                username: state.username,
                email: state.email,
                avatar_src: state.avatar_src,
                created_at: new Date(),
                updated_at: new Date()
            });

            await userLogin.relateTo(userLoginType, 'user_login_type');
            await userLogin.relateTo(user, 'user');
            await userState.relateTo(userStatusState, 'user_status_state');

            await userPasswordReset.relateTo(user, 'user');
            await user.relateTo(userState, 'user_status');
            await user.relateTo(userEmailVerification, 'user_email_verification');
        }
    }

    async down(neodeInstance) {
        for (let state of data.users) {
            const user = await neodeInstance.model('User').find(state.uuid);
            if (!user) {
                continue;
            }

            const userState = await user.get("user_status");
            const userEmailVerification = await user.get("user_email_verification");
            const userPasswordReset = await user.get("user_password_resets");

            await userState?.delete();
            await userEmailVerification?.delete();
            await userPasswordReset?.delete();
            await user.delete();
        }        
    }
}

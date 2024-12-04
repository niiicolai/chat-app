import data from '../../../seed_data.js';

export default class UserSeeder {
    order() {
        return 1;
    }

    async up(neodeInstance) {
        await Promise.all(data.users.map(async (userData) => {
            return new Promise(async (resolve, reject) => {
                const user = await neodeInstance.model('User').create({
                    uuid: userData.uuid,
                    username: userData.username,
                    email: userData.email,
                    avatar_src: userData.avatar_src,
                });

                const userLogin = await neodeInstance.model('UserLogin').create({
                    uuid: userData.user_logins[0].uuid,
                    password: userData.user_logins[0].password,
                });

                const userStatus = await neodeInstance.model('UserStatus').create({
                    uuid: userData.user_status.uuid,
                    last_seen_at: userData.user_status.last_seen_at,
                    message: userData.user_status.message,
                    total_online_hours: userData.user_status.total_online_hours,
                });

                const userEmailVerification = await neodeInstance.model('UserEmailVerification').create({
                    uuid: userData.user_email_verification.uuid,
                    is_verified: true,
                });

                const userPasswordReset = await neodeInstance.model('UserPasswordReset').create({
                    uuid: userData.user_password_resets[0].uuid,
                    expires_at: new Date(),
                });

                await user.relateTo(userLogin, 'user_login');
                await user.relateTo(userPasswordReset, 'user_password_reset');
                await user.relateTo(userStatus, 'user_status');
                await user.relateTo(userEmailVerification, 'user_email_verification');

                await neodeInstance.batch([
                    {
                        query:
                            'MATCH (ul:UserLoginType {name: "Password"}) ' +
                            'MATCH (us:UserLogin {uuid: $uuid}) ' +
                            'CREATE (us)-[:TYPE_IS]->(ul)',
                        params: { uuid: userData.user_logins[0].uuid }
                    },
                    {
                        query:
                            'MATCH (us:UserStatus {uuid: $uuid}) ' +
                            'MATCH (uss:UserStatusState {name: "Offline"}) ' +
                            'CREATE (us)-[:STATE_IS]->(uss)',
                        params: { uuid: userData.user_status.uuid }
                    },
                ]);

                resolve();
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:User) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:UserLogin) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:UserStatus) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:UserEmailVerification) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:UserPasswordReset) DETACH DELETE n');
    }
}

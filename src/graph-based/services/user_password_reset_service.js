import Validator from '../../shared/validators/user_password_reset_service_validator.js';
import PwdService from '../../shared/services/pwd_service.js';
import err from '../../shared/errors/index.js';
import CreateResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import ConfirmResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';
import neodeInstance from '../neode/index.js';
import { v4 as v4uuid } from 'uuid';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error(`
    WEBSITE_HOST is not defined in the .env file.
    - User password reset is currently not configured correct.
    - Add WEBSITE_HOST=http://localhost:3000 to the .env file.
`);

/**
 * @class UserPasswordResetService
 * @description Service class for user password reset
 * @exports UserPasswordResetService
 */
class UserPasswordResetService {

    /**
     * @function create
     * @description Create a user password reset
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.email
     * @param {String} resetUuid - optional (mainly for testing)
     * @returns {Promise<void>}
     */
    async create(options = { body: null }, resetUuid = null) {
        Validator.create(options);

        const { body } = options;
        const { email } = body;

        const user = await neodeInstance.model('User').first({ email });
        if (!user) return;

        const uuid = resetUuid || v4uuid();
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 1);

        await neodeInstance.batch([{
            query:
                `MATCH (u:User {email: $email}) ` +
                `CREATE (upr:UserPasswordReset {uuid: $uuid, expires_at: $expires_at, created_at: datetime(), updated_at: datetime()}) ` +
                `CREATE (u)-[:RESETTED_BY]->(upr)`,
            params: { email, uuid, expires_at: expires_at.toISOString() }
        }]);

        const userProps = user.properties();
        const to = userProps.email;
        const username = userProps.username;
        const confirmUrl = `${WEBSITE_HOST}/api/v1/neo4j/user_password_reset/${uuid}/reset_password`;
        const mail = new CreateResetMailer({ confirmUrl, username, to });
        await mail.send();
    }

    /**
     * @function resetPassword
     * @description Reset a user password
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.password
     * @returns {Promise<void>}
     */
    async resetPassword(options = { uuid: null, body: null }) {
        Validator.resetPassword(options);

        const { uuid, body } = options;

        const passwordReset = await neodeInstance.model('UserPasswordReset').find(uuid);
        if (!passwordReset) throw new err.EntityNotFoundError('user_password_reset');

        const user = passwordReset.get('user')?.startNode()?.properties();
        if (!user) throw new err.EntityNotFoundError('user');

        const passwordResetProps = passwordReset.properties();
        if (passwordResetProps.expires_at < new Date()) {
            throw new err.EntityExpiredError('user_password_reset');
        }

        const hashedPassword = await PwdService.hash(body.password);

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {

            // Delete password reset
            await tx.run(
                `MATCH (upr:UserPasswordReset {uuid: $uuid}) ` +
                `DETACH DELETE upr`,
                { uuid }
            );

            // Find user password login            
            const userLogins = await tx.run(
                `MATCH (u:User {uuid: $user_uuid})-[:AUTHORIZE_VIA]->(ul:UserLogin) ` +
                `MATCH (ul)-[:TYPE_IS]->(ult:UserLoginType {name: 'Password'}) ` +
                `RETURN ul`,
                { user_uuid: user.uuid }
            );

            // if no user password was found create one, else update the existing one
            if (userLogins.records.length === 0) {
                await tx.run(
                    `MATCH (u:User {uuid: $user_uuid}) ` +
                    `MATCH (ult:UserLoginType {name: 'Password'}) ` +
                    `CREATE (ul:UserLogin {password: $hashedPassword, created_at: datetime(), updated_at: datetime()}) ` +
                    `CREATE (u)-[:AUTHORIZE_VIA]->(ul) ` +
                    `CREATE (ul)-[:TYPE_IS]->(ult)`,
                    { user_uuid: user.uuid, hashedPassword }
                );
            } else {
                await tx.run(
                    `MATCH (u:User {uuid: $user_uuid})-[:AUTHORIZE_VIA]->(ul:UserLogin) ` +
                    `MATCH (ul)-[:TYPE_IS]->(:UserLoginType {name: 'Password'}) ` +
                    `SET ul.password = $hashedPassword, ul.updated_at = datetime()`,
                    { user_uuid: user.uuid, hashedPassword }
                );
            }

            tx.commit();
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        const username = user.username;
        const to = user.email;
        const mail = new ConfirmResetMailer({ username, to });
        await mail.send();
    }
}

const service = new UserPasswordResetService();

export default service;

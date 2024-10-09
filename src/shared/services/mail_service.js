import gmail from '../../../google-cloud/gmail.cjs';
const { sendMail } = gmail;

/**
 * @class MailService
 * @description Mail service class
 * @exports MailService
 */
export default class MailService {

    /**
     * @function sendMail
     * @param {string} textContent
     * @param {string} subject
     * @param {string} to
     * @throws {Error}
     * @returns {void}
     */
    static async sendMail(textContent, subject, to) {
        if (!textContent) {
            throw new Error('Mail content is required');
        }
        if (!subject) {
            throw new Error('Mail subject is required');
        }
        if (!to) {
            throw new Error('Mail "to" is required');
        }

        await sendMail(textContent, subject, to);
    }
}

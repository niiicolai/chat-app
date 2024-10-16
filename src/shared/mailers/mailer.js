import validator from 'validator';
import gmail from '../../../google-cloud/gmail.cjs';

export default class Mailer {
    
    to() {
        throw new Error('Method not implemented');
    }
    
    subject() {
        throw new Error('Method not implemented');
    }

    content() {
        throw new Error('Method not implemented');
    }

    async send() {
        const to = this.to();
        const subject = this.subject();
        const content = this.content();

        if (typeof content !== 'string') throw new Error('Mailer.content() must return a string. Got: ' + typeof content);
        if (typeof subject !== 'string') throw new Error('Mailer.subject() must return a string. Got: ' + typeof subject);
        if (typeof to !== 'string') throw new Error('Mailer.to() must return a string. Got: ' + typeof to);
        if (!validator.isEmail(to)) throw new Error('Mailer.to() must return a valid email address. Got: ' + to);

        await gmail.sendMail(content, subject, to);
    }
}

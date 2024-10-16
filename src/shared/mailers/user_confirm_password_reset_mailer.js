import Mailer from './mailer.js';

export default class UserConfirmPasswordResetMailer extends Mailer {

    constructor(options = {username: null, to: null}) {
        super();

        if (!options) throw new Error('options is required');
        if (!options.username) throw new Error('username is required');
        if (!options.to) throw new Error('to is required');
        
        this.username = options.username;
        this._to = options.to;
    }
    
    to() {
        return this._to;
    }
    
    subject() {
        return 'Demo Chat App: Password Reset Successful';
    }

    content() {
        return `Hi ${this.username},\n\nYour password has been successfully reset.\n\nIf you did not request to reset your password, please contact us immediately.\n\nThanks,\nThe Team`;
    }
}

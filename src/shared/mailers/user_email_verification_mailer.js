import Mailer from './mailer.js';

export default class UserEmailVerificationMailer extends Mailer {

    constructor(options = {confirmUrl: null, username: null, to: null}) {
        super();
        
        if (!options) throw new Error('options is required');
        if (!options.to) throw new Error('to is required');
        if (!options.username) throw new Error('username is required');
        if (!options.confirmUrl) throw new Error('confirmUrl is required');
        
        this.username = options.username;
        this._to = options.to;
        this.confirmUrl = options.confirmUrl;
    }
    
    to() {
        return this._to;
    }
    
    subject() {
        return 'Demo Chat App: Please verify your email address';
    }

    content() {
        return `Hi ${this.username},\n\nPlease verify your email address by clicking the link below:\n${this.confirmUrl}\n\nIf you did not sign up for an account, please ignore this email.\n\nThanks,\nThe Team`;
    }
}

import Mailer from './mailer.js';

export default class UserCreatePasswordResetMailer extends Mailer {

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
        return 'Demo Chat App: Password Reset';
    }

    content() {
        return `Hi ${this.username},\n\nYou have requested to reset your password. Please click the link below to reset your password:\n${this.confirmUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request to reset your password, please ignore this email.\n\nThanks,\nThe Team`;
    }
}

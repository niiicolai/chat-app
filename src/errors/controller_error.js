

export default class ControllerError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'ControllerError';
        this.code = code;
    }
}
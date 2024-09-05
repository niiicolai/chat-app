

export default class UploadError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ControllerError';
    }
}

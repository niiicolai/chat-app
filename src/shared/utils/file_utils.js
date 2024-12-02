
/**
 * Get the file extension from the file name
 * @param {String} fileName
 * @returns {String}
 */
export const getUploadType = (file) => {
    const mime = file.mimetype;
    if (mime.startsWith('image')) {
        return 'Image';
    } else if (mime.startsWith('video')) {
        return 'Video';
    } else {
        return 'Document';
    }
};

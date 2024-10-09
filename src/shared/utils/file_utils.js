

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

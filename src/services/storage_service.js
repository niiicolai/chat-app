/**
 * Copied from: https://github.com/VR-web-shop/Products/blob/main/src/services/StorageService.js
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const {
    S3_ENDPOINT_URL,
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME,
    S3_REGION,
    S3_ENDPOINT_PROTOCOL,
    S3_CDN_URL
} = process.env;

/**
 * @class StorageService
 * @description The storage service.
 * @param {string} prefix - A prefix added to the key.
 * @param {string} endpoint - The S3 endpoint.
 * @param {string} region - The S3 region.
 * @param {string} bucketName - The S3 bucket name.
 * @param {Object} credentials - The S3 credentials.
 * @param {string} cdnURL - The full S3 CDN URL.
 */
export default class StorageService {

    /**
     * @constructor
     * @param {string} prefix - A prefix added to the key.
     * @param {string} endpoint - The S3 endpoint.
     * @param {string} region - The S3 region.
     * @param {string} bucketName - The S3 bucket name.
     * @param {Object} credentials - The S3 credentials.
     * @param {string} cdnURL - The full S3 CDN URL.
     */
    constructor(
        prefix = '',
        endpoint = `${S3_ENDPOINT_PROTOCOL}${S3_ENDPOINT_URL}`,
        region = S3_REGION,
        bucketName = S3_BUCKET_NAME,
        credentials = {
            accessKeyId: S3_ACCESS_KEY_ID,
            secretAccessKey: S3_SECRET_ACCESS_KEY
        },
        cdnURL = S3_CDN_URL
    ) {
        this.Bucket = bucketName;
        this.prefix = prefix;
        this.cdnURL = cdnURL;
        this.s3 = new S3Client({
            endpoint,
            region,
            credentials
        });
    }

    /**
     * @function upload
     * @description Upload a file to an S3 bucket.
     * @param {Object} params - The params.
     * @param {string} params.Key - The key name.
     * @param {Buffer} params.Body - The file's buffer.
     * @param {string} params.ACL - The file's ACL.
     * @param {string} params.Bucket - The bucket name.
     * @returns {Promise<string>} - The promise.
     * @throws {Error} - The error.
     */
    async upload(params) {
        const command = new PutObjectCommand(params);
        try {
            await this.s3.send(command);
            return `${this.cdnURL}/${params.Key}`;
        } catch (error) {
            console.error("Error uploading file to S3:", error);
            throw error;
        }
    }

    async uploadFile(file, key, ACL = 'public-read') {
        const { buffer, mimetype } = file;
        const originalname = file.originalname.split('.').slice(0, -1).join('.').replace(/\s/g, '');
        const timestamp = new Date().getTime();
        const filename = `${originalname}-${key}-${timestamp}.${mimetype.split('/')[1]}`;

        const { Bucket, prefix } = this;
        
        return this.upload({ Bucket, Key: `${prefix}/${filename}`, Body: buffer, ACL });
    }


    /**
     * @function updateFile
     * @description Update a file in an S3 bucket.
     * @param {Buffer} Body - The file's buffer.
     * @param {string} Key - The key name.
     * @returns {Promise} - The promise.
     * @throws {Error} - The error.
     */
    async updateFile(Body, Key, ACL = 'public-read') {
        const { Bucket } = this;
        return this.upload({ Bucket, Key, Body, ACL });
    }

    /**
     * @function deleteFile
     * @description Delete a file from an S3 bucket.
     * @param {string} Key - The key name.
     * @returns {Promise} - The promise.
     * @throws {Error} - The error.
     */
    async deleteFile(Key) {
        const { Bucket } = this;
        const params = { Bucket, Key };
        const command = new DeleteObjectCommand(params);
        try {
            await this.s3.send(command);
        } catch (error) {
            console.error("Error deleting file from S3:", error);
            throw error;
        }
    }

    /**
     * @function parseKey
     * @description Parse a key.
     * @param {string} url - The url.
     * @returns {string} - The key.
     */
    parseKey(url) {
        return url.replace(`${this.cdnURL}/`, '');
    }
}
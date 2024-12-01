import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const S3_ENDPOINT_URL = process.env.S3_ENDPOINT_URL;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION;
const S3_ENDPOINT_PROTOCOL = process.env.S3_ENDPOINT_PROTOCOL;
const S3_CDN_URL = process.env.S3_CDN_URL;

const region = S3_REGION;
const Bucket = S3_BUCKET_NAME;
const endpoint = `${S3_ENDPOINT_PROTOCOL}${S3_ENDPOINT_URL}`;
const credentials = { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY };
const s3Client = new S3Client({ endpoint, region, credentials });

export default class Uploader {
    constructor(directory = '') {
        if (!directory) throw new Error('directory is required');
        this.directory = directory;
    }

    async createOrUpdate(url, file, uniqueIdentifier, ACL = 'public-read') {
        if (url) {
            return await this.update(url, file, uniqueIdentifier, ACL);
        } else {
            return await this.create(file, uniqueIdentifier, ACL);
        }
    }

    async create(file, uniqueIdentifier, ACL = 'public-read') {
        if (!file) throw new Error('file is required');
        if (!uniqueIdentifier) throw new Error('uniqueIdentifier is required');

        try {
            const { buffer: Body, mimetype } = file;
            const timestamp = new Date().getTime();
            const ending = mimetype.split('/')[1];
            const originalname = file.originalname.split('.').slice(0, -1).join('.').replace(/\s/g, '');
            const savedName = `${originalname}-${uniqueIdentifier}-${timestamp}.${ending}`;
            const Key = `${this.directory}/${savedName}`;

            await s3Client.send(new PutObjectCommand({ Bucket, Key, Body, ACL }));
            return `${S3_CDN_URL}/${Key}`;

        } catch (error) {
            console.error("Error uploading file to S3:", error);
            throw error;
        }
    }

    async update(url, file, uniqueIdentifier, ACL = 'public-read') {
        if (!url) throw new Error('url is required');
        if (!file) throw new Error('file is required');

        try {
            await this.destroy(url);
            return await this.create(file, uniqueIdentifier, ACL);
        } catch (error) {
            console.error("Error updating file on S3:", error);
            throw error;
        }
    }

    async destroy(url) {
        if (!url) throw new Error('url is required');

        try {
            const Key = url.replace(`${S3_CDN_URL}/`, '');
            await s3Client.send(new DeleteObjectCommand({ Bucket, Key }));
        } catch (error) {
            console.error("Error deleting file from S3:", error);
            throw error;
        }
    }
}

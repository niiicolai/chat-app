import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const S3_ENDPOINT_URL = process.env.S3_ENDPOINT_URL;
if (!S3_ENDPOINT_URL) console.error('S3_ENDPOINT_URL is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_ENDPOINT_URL=fra1.digitaloceanspaces.com (if using DigitalOcean) to the .env file.');


const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
if (!S3_ACCESS_KEY_ID) console.error('S3_ACCESS_KEY_ID is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_ACCESS_KEY_ID=your_access_key_id to the .env file.');


const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
if (!S3_SECRET_ACCESS_KEY) console.error('S3_SECRET_ACCESS_KEY is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_SECRET_ACCESS_KEY=your_secret_access_key to the .env file.');


const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
if (!S3_BUCKET_NAME) console.error('S3_BUCKET_NAME is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_BUCKET_NAME=your_bucket_name to the .env file.');


const S3_REGION = process.env.S3_REGION;
if (!S3_REGION) console.error('S3_REGION is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_REGION=your_region to the .env file.');


const S3_ENDPOINT_PROTOCOL = process.env.S3_ENDPOINT_PROTOCOL;
if (!S3_ENDPOINT_PROTOCOL) console.error('S3_ENDPOINT_PROTOCOL is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_ENDPOINT_PROTOCOL=https:// to the .env file.');


const S3_CDN_URL = process.env.S3_CDN_URL;
if (!S3_CDN_URL) console.error('S3_CDN_URL is not defined in the .env file.\n  - File uploads are currently not configured correct.\n  - Add S3_CDN_URL=https://your_bucket_name.fra1.digitaloceanspaces.com to the .env file.');


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

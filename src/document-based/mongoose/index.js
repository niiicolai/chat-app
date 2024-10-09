import mongoose from 'mongoose';

const env = process.env.NODE_ENV || 'development';
const e = { development: 'DEV', test: 'TEST', production: 'PROD' };
const connectionString = process.env[`MONGO_${e[env]}_DATABASE_URL`];

mongoose.connect(connectionString, {})
    .then(() => console.log('INFO: Connected to MongoDB'))
    .catch((err) => console.error('ERROR: Could not connect to MongoDB', err));

export default mongoose;


import 'dotenv/config';
import './src/jobs/file_retention_check.js';
import './src/jobs/message_retention_check.js';
import './src/jobs/mysql_backup.js';
import './src/jobs/mongo_backup.js';
import './src/jobs/neo4j_backup.js';

console.log('INFO: Cron background jobs started');

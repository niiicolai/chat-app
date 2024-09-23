
import 'dotenv/config';
import './src/jobs/file_retention_check.js';
import './src/jobs/message_retention_check.js';
import './src/jobs/mysql_backup.js';

console.log('Cron background jobs started');

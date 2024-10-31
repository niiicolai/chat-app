
import 'dotenv/config';

import './src/document-based/jobs/file_retention_check.js';
import './src/document-based/jobs/message_retention_check.js';
import './src/document-based/jobs/mongodb_backup.js';

import './src/relational-based/jobs/file_retention_check.js';
import './src/relational-based/jobs/message_retention_check.js';
import './src/relational-based/jobs/mysql_backup.js';

console.log('INFO: Cron background jobs started');

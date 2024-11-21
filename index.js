// Initialize the environment variables
import 'dotenv/config'

// Initialize the email client
import './google-cloud/load_auth.js';

// Initialize the MongoDB database connection
import './src/document-based/mongoose/index.js'

// Initialize the Neo4j database connection
import './src/graph-based/neode/index.js'

// Initialize the Web Server
import './web_server.js'

// Initialize the websocket server
import './websocket_server.js'

// Initialize the cron jobs
import './cron.js'
console.warn('todo: add search endpoint')
// Initialize the environment variables
import 'dotenv/config'

// Initialize the MongoDB database connection
import './mongoose/index.js'

// Initialize the Web Server
import './web_server.js'

// Initialize the websocket server
import './websocket_server.js'

// Initialize the cron jobs
import './cron.js'

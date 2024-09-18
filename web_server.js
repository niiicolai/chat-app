import cors from 'cors'
import express from 'express'

import useMysqlControllers from './src/controllers/v1/mysql/_mysql_controllers.js'
import useMongodbControllers from './src/controllers/v1/mongodb/_mongodb_controllers.js'
import useNeo4jControllers from './src/controllers/v1/neo4j/_neo4j_controllers.js'
import useWebsocketControllers from './src/controllers/v1/websocket/_websocket_controllers.js'
import swaggerController from './src/controllers/swagger_controller.js'

const port = process.env.WEB_PORT
if (!port) {
    console.error('WEB_PORT is not defined in .env')
    process.exit(1)
}
const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(swaggerController);
useMysqlControllers(app);
useMongodbControllers(app);
useNeo4jControllers(app);
useWebsocketControllers(app);

app.listen(port, () => {
    console.log(`Web Server is running on port http://localhost:${port}`)
    console.log(`API docs: http://localhost:${process.env.WEB_PORT}/api-docs`)
})

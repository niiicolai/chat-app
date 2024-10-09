import cors from 'cors'
import express from 'express'

import useNeo4jControllers from './src/graph-based/controllers/_neo4j_controllers.js'
import useMysqlControllers from './src/relational-based/controllers/_mysql_controllers.js'
import useMongodbControllers from './src/document-based/controllers/_mongodb_controllers.js'
import useWebsocketControllers from './src/shared/websocket/controllers/_websocket_controllers.js'
import swaggerController from './src/shared/controllers/swagger_controller.js'

const port = process.env.WEB_PORT || 3000
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
    console.log(`INFO: Web Server is running on port http://localhost:${port}`)
    console.log(`INFO: API docs: http://localhost:${port}/api-docs`)
})

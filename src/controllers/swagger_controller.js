import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dir from 'path';
import express from 'express';
import schemas from '../openapi/components/_schemas.js';
import securitySchemes from '../openapi/components/_security_schemes.js';

const __dirname = dir.resolve();
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chat API',
            description: "API endpoints for Chat Application",
            contact: {
                name: "GitHub Repository",
                url: "https://github.com/niiicolai/chat-app"
            },
            version: '1.0.0',
        },
        components: {
            securitySchemes,
            schemas
        }
    },
    apis: [
        `${__dirname}/src/controllers/v1/mongodb/*.js`,
        `${__dirname}/src/controllers/v1/mysql/*.js`,
        `${__dirname}/src/controllers/v1/neo4j/*.js`
    ]
}

const router = express.Router();
const swaggerDocument = swaggerJsdoc(options);
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;

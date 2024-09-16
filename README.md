# Server Features
- REST API
    - Error Handling [x]
    - Rollbar Error Logging [x]
    - Swagger API Documentation [x]
    - Authentication Middleware [x]
    - Logging Middleware [x]
    - CSRF Middleware []
    - CORS Middleware []
    - File Middleware [x]
    - File Upload [x]
    - MySQL API [x]
    - MongoDB API []
    - Neo4j API []
- Websockets
    - Real-time Chat Messaging [x]
    - Join/Leave Channel [x]
- WebRTC
    - Video Call []
    - Audio Call []
    - Screen Sharing []
- Authentication
    - JWT Token [x]
    - User Registration [x]
    - User Login [x]
    - Bcrypt Password Hashing [x]
- File Storage
    - S3 File Storage [x]
    - CDN [x]
- Environment Variables
    - .env File [x]
    - .env.example File [x]
- Database
    - MySQL
        - Tables [x]
        - Views [x]
        - Stored Procedures [x]
        - Stored Functions [x]
        - Triggers [x]
        - Events [x]
        - Indexes [x]
        - Transactions [x]
        - Granular User Permissions [x]
        - Migration []
        - Seeding []
        - Backup []
    - MongoDB []
    - Neo4j []
- Docker
    - Dockerfile [x]
    - Docker Compose [x]
- CI/CD
    - Github Actions [x]
    - Github Secrets [x]
- Deployment
    - Digitalocean [x]
- Testing
    - Unit Testing []
    - Integration Testing []


# Development Environment Setup
The following are the steps to set up the development environment for the chat application.

## Install
```bash
npm install
cp .env.example .env
```

## Run
```bash
npm start
```

## Test
```bash
npm test
```

## API Docs
The application uses Swagger for the API documentation for the REST API and a custom HTML file for the websocket documentation. The documentations can be accessed via the following links after starting the application:
- Web server: http://localhost:3000/api-docs
- Websocket server: http://localhost:3000/websocket/api-docs

# Frontend Clients
The chat application has been implemented using different frontend frameworks. The following are the links to the frontend clients:
- React Client: https://github.com/niiicolai/chat-app-react
- Vue Client: https://github.com/niiicolai/chat-app-vue

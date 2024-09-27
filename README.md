# Chat App Backend
A Node.js backend designed for a chat application.

## Deployment Status
[![VM Publish Production](https://github.com/niiicolai/chat-app/actions/workflows/deploy_vm.yml/badge.svg)](https://github.com/niiicolai/chat-app/actions/workflows/deploy_vm.yml)

[![Docker Hub Deploy](https://github.com/niiicolai/chat-app/actions/workflows/deploy_docker_hub.yml/badge.svg)](https://github.com/niiicolai/chat-app/actions/workflows/deploy_docker_hub.yml)

## Features
| Feature                | Subfeature                          | Status  |
|------------------------|-------------------------------------|---------|
| **REST API**           | Error Handling                      | [x]     |
|                        | Rollbar Error Logging               | [x]     |
|                        | Swagger API Documentation           | [x]     |
|                        | Authentication Middleware           | [x]     |
|                        | Logging Middleware                  | [x]     |
|                        | CSRF Middleware                     | [ ]     |
|                        | CORS Middleware                     | [ ]     |
|                        | File Middleware                     | [x]     |
|                        | File Upload                         | [x]     |
|                        | MySQL API                          | [x]     |
|                        | MongoDB API                        | [ ]     |
|                        | Neo4j API                         | [ ]     |
| **Websockets**         | Real-time Chat Messaging            | [x]     |
|                        | Join/Leave Channel                  | [x]     |
| **WebRTC**             | Video Call                          | [ ]     |
|                        | Audio Call                          | [ ]     |
|                        | Screen Sharing                      | [ ]     |
| **Authentication**     | JWT Token                           | [x]     |
|                        | User Registration                   | [x]     |
|                        | User Login                          | [x]     |
|                        | Bcrypt Password Hashing             | [x]     |
|                        | Forgot Password                     | [ ]     |
|                        | Email Verification                  | [ ]     |
|                        | Two Factor Authentication           | [ ]     |
| **File Storage**       | S3 File Storage                     | [x]     |
|                        | CDN                                 | [x]     |
| **Environment Variables** | .env File                        | [x]     |
|                        | .env.example File                   | [x]     |
| **Cron Jobs**          | File Retention                      | [x]     |
|                        | Message Retention                   | [x]     |
|                        | MySQL Backup                        | [x]     |
| **Database**           | MySQL                               |         |
|                        | Tables                              | [x]     |
|                        | Views                               | [x]     |
|                        | Stored Procedures                   | [x]     |
|                        | Stored Functions                    | [x]     |
|                        | Triggers                            | [x]     |
|                        | Events                              | [x]     |
|                        | Indexes                             | [x]     |
|                        | Transactions                        | [x]     |
|                        | Granular User Permissions           | [x]     |
|                        | Migration                           | [ ]     |
|                        | Seeding                             | [ ]     |
|                        | Backup                              | [x]     |
|                        | MongoDB                             | [ ]     |
|                        | Neo4j                               | [ ]     |
| **Docker**             | Dockerfile                          | [x]     |
|                        | Docker Compose                      | [x]     |
| **CI/CD**              | GitHub Actions                      | [x]     |
|                        | GitHub Secrets                      | [x]     |
| **Deployment**         | DigitalOcean                        | [x]     |
| **Testing**            | Unit Testing                        | [ ]     |
|                        | Integration Testing                 | [ ]     |


## Development Environment Setup
The following are the steps to set up the development environment for the chat application.

### Install
```bash
npm install
cp .env.example .env
```

### Run
```bash
npm start
```

### Test
```bash
npm test
```

### Generate JS Docs
```bash
npm run jsdoc
```

### Sequelize
```bash
npm run sequelize:migrate           # Execute migration files to update the database schema
npm run sequelize:migrate:undo      # Revert the most recent migration
npm run sequelize:migrate:undo:all  # Revert all migrations
npm run sequelize:migrate:generate  # Create a new migration file with a timestamp
npm run sequelize:seed              # Run seed files to populate the database with initial data
npm run sequelize:seed:undo         # Revert the most recent seed operation
npm run sequelize:seed:generate     # Create a new seed file with a timestamp

```

### API Docs
The application uses Swagger for the API documentation for the REST API and a custom HTML file for the websocket documentation. The documentations can be accessed via the following links after starting the application:
- Web server: http://localhost:3000/api-docs
- Websocket server: http://localhost:3000/websocket/api-docs

### Frontend Clients
The chat application has been implemented using different frontend frameworks. The following are the links to the frontend clients:
- React Client: https://github.com/niiicolai/chat-app-react
- Vue Client: https://github.com/niiicolai/chat-app-vue

## Docker
Build and run the backend using Docker.

### Build
```
docker build -t chat_app:v1.0 .
```

### Run in detached mode
```
docker run -d -p 3000:3000 -p 3001:3001 chat_app:v1.0 
```

## Docker Compose
The project contains two Docker compose files:
- **[compose-hub-image.yml](https://github.com/niiicolai/chat-app/blob/main/compose-hub-image.yml)**: Fetches prebuilt images from Docker Hub for the chat backend, React.js frontend client, and MySQL. This Compose file is designed for quickly testing the chat application as a whole.
- **[compose-local-image.yml](https://github.com/niiicolai/chat-app/blob/main/compose-local-image.yml)**: Expects the machine to have a local Docker image of the application build. Refer to the section on building a Docker image before using this Compose file.

### Run *Docker Hub Image* in detached mode
```
docker-compose -f compose-hub-image.yml up -d
```

### Run *Local Docker Image* in detached mode
```
docker-compose -f compose-local-image.yml up -d
```

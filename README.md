# Chat App Backend
A Node.js chat backend application.

# Quickest Way to Try the Application
The project includes a Compose file named `compose-hub-image.yml`, which is designed to run the entire application in a local environment, including databases, the backend, and the frontend. For more details, refer to [#run-docker-hub-image-in-detached-mode](https://github.com/niiicolai/chat-app?tab=readme-ov-file#run-docker-hub-image-in-detached-mode)

After starting the Docker compose, the application will be available at http://127.0.0.1:5174 with complete test data.

## Deployment Status
[![VM Publish Production and Docker Hub ](https://github.com/niiicolai/chat-app/actions/workflows/deploy_vm.yml/badge.svg)](https://github.com/niiicolai/chat-app/actions/workflows/deploy_vm.yml)

## Features
| Feature                | Subfeature                          | Status  |
|------------------------|-------------------------------------|---------|
| **REST API**           | Error Handling                      | [x]     |
|                        | Rollbar Error Logging               | [x]     |
|                        | Swagger API Documentation           | [x]     |
|                        | Authentication Middleware           | [x]     |
|                        | Logging Middleware                  | [x]     |
|                        | CSRF Middleware                     | [ ]     |
|                        | Origin Middleware                   | [ ]     |
|                        | File Middleware                     | [x]     |
|                        | File Upload                         | [x]     |
|                        | MySQL API                           | [x]     |
|                        | MongoDB API                         | [x]     |
|                        | Neo4j API                           | [x]     |
| **Websockets**         | Real-time Chat Messaging            | [x]     |
|                        | Join/Leave Channel                  | [x]     |
|                        | Real-time typing                    | [ ]     |
| **WebRTC**             | Video Call                          | [ ]     |
|                        | Audio Call                          | [ ]     |
|                        | Screen Sharing                      | [ ]     |
| **Authentication**     | JWT Token                           | [x]     |
|                        | User Registration                   | [x]     |
|                        | User Login                          | [x]     |
|                        | User Online Status                  | [x]     |
|                        | Bcrypt Password Hashing             | [x]     |
|                        | Reset Password                      | [x]     |
|                        | Email Verification                  | [x]     |
|                        | Two Factor Authentication           | [ ]     |
| **File Storage**       | S3 File Storage                     | [x]     |
|                        | CDN                                 | [x]     |
| **Environment Var.**   | .env File                           | [x]     |
|                        | .env.example File                   | [x]     |
| **Cron Jobs**          | File Retention                      | [x]     |
|                        | Message Retention                   | [x]     |
|                        | MySQL Backup                        | [x]     |
| **Database**           | MySQL                               | [x]     |
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
|                        | MongoDB                             | [x]     |
|                        | Neo4j                               | [ ]     |
| **Docker**             | Dockerfile                          | [x]     |
|                        | Docker Compose                      | [x]     |
| **CI/CD**              | GitHub Actions                      | [x]     |
|                        | GitHub Secrets                      | [x]     |
|                        | Virtual Machine                     | [x]     |
|                        | Docker Hub                          | [x]     |
| **Testing**            | Unit Testing                        | [ ]     |
|                        | Integration Testing                 | [ ]     |


## Development Environment Setup
The following are the steps to set up the development environment for the chat application.

## Requirements
- Node.js
- MySQL
- MongoDB
- Neo4j

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

### Mongoose
```bash
npm run mongoose:seed               # Run seed files to populate the database with initial data
npm run mongoose:seed:undo          # Revert all seeded data
```

### Setup DBs
```bash
npm run db:override                 # Override the existing MySQL using ./MySQL_Script.sql
                                    # & Seed the existing MongoDB.
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
- **[compose-hub-image.yml](https://github.com/niiicolai/chat-app/blob/main/compose-hub-image.yml)**: Fetches prebuilt images from Docker Hub for the chat backend, React.js frontend client, MongoDB, Neo4j and MySQL. This Compose file is designed for quickly testing the chat application as a whole. Note: *This setup doesn't include configuration for S3 to avoid exposing any secrets, which means file uploads doesn't work.*
- **[compose-local-image.yml](https://github.com/niiicolai/chat-app/blob/main/compose-local-image.yml)**: Expects the machine to have a local Docker image of the application build. *It only starts an instance of the backend application and MySQL (no frontend)*. Refer to the section on building a Docker image before using this Compose file.

### Run *Docker Hub Image* in detached mode
```
docker-compose -f compose-hub-image.yml up -d
```

### Run *Local Docker Image* in detached mode
```
docker-compose -f compose-local-image.yml up -d
```

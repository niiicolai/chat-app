# Base image
FROM node:18-slim

WORKDIR /app

# Copy package and env files
COPY package*.json ./
COPY .env* ./
COPY gmail_credentials.json ./
COPY gmail_token.json ./

# Install MySQL client
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    bash \
    curl \
    wget \
    gnupg

# Install MongoDB Database Tools
RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
RUN apt-get update && apt-get install -y mongodb-database-tools

# Install Neo4j Admin CLI
RUN wget -O - https://debian.neo4j.com/neotechnology.gpg.key | apt-key add -
RUN echo "deb https://debian.neo4j.com stable 4.4" | tee -a /etc/apt/sources.list.d/neo4j.list
RUN apt-get update && apt-get install -y neo4j

# Clean up apt cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Wait-for-it script
RUN curl -o /app/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /app/wait-for-it.sh

# Install npm dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose ports
EXPOSE 3000 3001

# Start the application
CMD ["node", "index.js"]

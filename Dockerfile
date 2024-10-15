FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .env* ./
COPY gmail_credentials.json ./
COPY gmail_token.json ./

# Install MySQL Client
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    bash \
    curl \
    wget \
    gnupg

# Install MongoDB Database Tools
RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
RUN apt-get update && apt-get install -y \
    mongodb-database-tools
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Wait-for-it
RUN curl -o /app/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /app/wait-for-it.sh

RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["node", "index.js"]

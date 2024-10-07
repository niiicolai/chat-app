FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .env* ./
COPY gmail_credentials.json ./
COPY gmail_token.json ./

RUN apt-get update && apt-get install -y \
    default-mysql-client \
    bash \
    curl

RUN curl -o /app/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /app/wait-for-it.sh

RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["node", "index.js"]

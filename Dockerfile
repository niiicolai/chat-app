FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .env* ./

RUN apt-get update && apt-get install -y default-mysql-client

RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["node", "index.js"]

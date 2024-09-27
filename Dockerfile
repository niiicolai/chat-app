FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .env* ./

RUN apt-get update && apt-get install -y \
    default-mysql-client \
    bash \
    curl

RUN curl -o /app/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /app/wait-for-it.sh

RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["sh", "-c", "./wait-for-it.sh mysql:3306 -- npm run db:override && exec node index.js"]

FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .env* ./

RUN apt-get update && apt-get install -y default-mysql-client

RUN apk add --no-cache bash curl \
    && curl -o /usr/src/app/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /usr/src/app/wait-for-it.sh

RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["node", "index.js"]

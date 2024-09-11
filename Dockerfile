FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .env* ./

RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["node", "/src/index.js"]

FROM node:20-alpine
WORKDIR /app
COPY package.json index.js README.md ./
RUN npm install --omit=dev
ENTRYPOINT ["node", "/app/index.js"]

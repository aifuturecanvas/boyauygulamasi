FROM node:20-slim
WORKDIR /srv
COPY package.json package-lock.json* ./
RUN npm i --omit=dev
COPY index.js ./
ENV PORT=8080
CMD ["npm", "start"]

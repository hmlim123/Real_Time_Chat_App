FROM node:18

WORKDIR /app

# Copy package.json first for caching
COPY package.json package-lock.json ./

RUN npm install

# Copy ALL project files (including `public/`)
COPY . .  

EXPOSE 5001

CMD ["node", "src/index.js"]

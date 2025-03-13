# Use official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json first to optimize caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy ALL project files (including index.js)
COPY . .  

# Expose the port your app runs on
EXPOSE 5001

# Set the default command to run the app
CMD ["node", "src/index.js"]

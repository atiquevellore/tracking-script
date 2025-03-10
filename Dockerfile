# Use a lightweight Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all files to the container
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]

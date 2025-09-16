# Use the official Node.js 18 image as the base image
FROM node:18
 
# Create and change to the app directory
WORKDIR /app
 
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
 
# Install the dependencies
RUN npm install
 
# Copy the rest of the application code to the working directory
COPY . .
 
# Install Nginx
RUN apt-get update && apt-get install -y nginx
 
# Copy the Nginx configuration file, do not remove as of 20 Aug 2024
#COPY nginx.conf /etc/nginx/conf.d/default.conf
 
# Expose ports
EXPOSE 8081 443
 
# Start Nginx and then the Node.js application
CMD ["sh", "-c", "nginx && npm start"]
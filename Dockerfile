FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy SSL certificates
RUN mkdir -p /etc/nginx/cert
COPY cert/cert.pem /etc/nginx/cert/
COPY cert/key.pem /etc/nginx/cert/

# Copy built app from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Set environment variables (can be overridden at runtime)
ENV HOST=0.0.0.0
ENV PORT=3000
ENV HTTPS=true

# Expose ports
EXPOSE 3000


# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
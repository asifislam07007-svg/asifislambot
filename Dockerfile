# Use official PHP image
FROM php:8.2-cli

# Set working directory
WORKDIR /app

# Copy all files to container
COPY . .

# Expose Render's dynamic port
ENV PORT=10000
EXPOSE $PORT

# Start PHP built-in server
CMD php -S 0.0.0.0:$PORT -t .

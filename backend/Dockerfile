# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Set environment variables for Python in Docker
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Expose the port
EXPOSE 8000

# The command to run the application (migrations and superuser will be run via docker-compose)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]
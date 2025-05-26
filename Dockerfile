# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the backend requirements file first to leverage Docker cache
# This assumes requirements.txt is inside the pulsi_politik_backend folder
COPY pulsi_politik_backend/requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
# --no-cache-dir reduces image size
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the entire backend application code into the container
# This creates /app/pulsi_politik_backend/ in the container
COPY pulsi_politik_backend/ /app/pulsi_politik_backend/

# Copy the entire frontend application code into the container
# This creates /app/pulsi_politik_frontend/ in the container
COPY pulsi_politik_frontend/ /app/pulsi_politik_frontend/

# Copy the static directory which contains assets like Leaflet
# This creates /app/static/ in the container
COPY static/ /app/static/

# Make port 8000 available to the world outside this container (Render will use this, or your specified port)
EXPOSE 8000

# Define environment variable for Flask (optional but good practice for clarity)
# This tells Flask where your app object is.
ENV FLASK_APP=pulsi_politik_backend.app

# Run the application using Gunicorn when the container launches
# This assumes:
# 1. Your Flask app instance is named 'app' in 'pulsi_politik_backend/app.py'
# 2. Gunicorn is installed (from requirements.txt)
# Gunicorn will listen on all interfaces (0.0.0.0) on port 8000 inside the container.
# Render automatically sets the PORT environment variable, so it's good to use it.
# If your requirements.txt doesn't have gunicorn, this CMD will fail.
# Ensure gunicorn is in pulsi_politik_backend/requirements.txt
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:$PORT", "pulsi_politik_backend.app:app"]
FROM python:3.13-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure environment
ENV FLASK_ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DATABASE_PATH=/app/pulsi_politik_backend/kcm_data.db

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fix permissions
RUN chmod a+w "$DATABASE_PATH"

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "pulsi_politik_backend.app:app"]
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Convert line endings and set execute permissions for scripts
RUN dos2unix start.sh && \
    chmod +x start.sh && \
    chmod +x manage.py

# Run the startup script
CMD ["./start.sh"] 
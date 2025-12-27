FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose gRPC port
EXPOSE 6000

# Run the ingestor
CMD ["python", "main.py"]

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Créer le dossier pour la base de données
RUN mkdir -p instance && chmod 777 instance
EXPOSE 5000
CMD ["python", "app.py"]
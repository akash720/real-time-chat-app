# Work In Progress...

# Real-Time Chat Application

A production-ready real-time chat application built with Django REST Framework and React.

## Features

- Real-time messaging using WebSocket
- User authentication
- Message history
- Online/Offline status
- Docker and Kubernetes support

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- Django Channels (for WebSocket)
- PostgreSQL
- Redis (for WebSocket layer)

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- WebSocket API

## Local Development

### Prerequisites
- Docker
- Docker Compose

### Quick Start

1. Clone the repository
```bash
git clone <your-repo-url>
cd real-time-chat-app
```

2. Start the application using Docker Compose
```bash
docker-compose up --build
```

3. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs/

## Kubernetes Deployment

Kubernetes manifests are provided in the `k8s` directory. To deploy:

1. Build and push the images
```bash
docker build -t your-registry/chat-backend:latest ./backend
docker build -t your-registry/chat-frontend:latest ./frontend
docker push your-registry/chat-backend:latest
docker push your-registry/chat-frontend:latest
```

2. Apply the manifests
```bash
kubectl apply -f k8s/
```

## Project Structure
```
.
├── backend/             # Django backend
├── frontend/           # React frontend
├── docker-compose.yml  # Local development
└── k8s/               # Kubernetes manifests
``` 
# Kaifan - Restaurant Call Queue Management System

A production-quality restaurant call queue management platform for a Mandhi restaurant, powered by Exotel telephony integration.

## Architecture

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│  Nginx  │────▶│ Frontend│     │ Backend  │────▶│  MySQL  │
│  (Proxy)│     │ (React) │     │(Spring)  │     │         │
│  :80    │────▶│  :3000  │     │  :8080   │     │  :3306  │
└─────────┘     └─────────┘     └──────────┘     └─────────┘
                                     │
                              ┌──────┴──────┐
                              │   Exotel    │
                              │  Webhooks   │
                              └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA, JWT |
| Frontend | React 18, TypeScript, Material UI 6, React Query, Zustand |
| Database | MySQL 8.0, Flyway Migrations |
| Telephony | Exotel (abstracted via TelephonyProvider interface) |
| Real-time | WebSocket (STOMP over SockJS) |
| Infrastructure | Docker, Docker Compose, Nginx |

## Quick Start

### One-command startup (Docker):
```bash
docker-compose up --build
```

Access at: **http://localhost**

### Development Mode:

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Employee | employee | employee123 |

## API Documentation

Swagger UI: http://localhost:8080/swagger-ui.html

## Exotel Webhook Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/exotel/incoming` | Handle incoming calls |
| `POST /api/exotel/connected` | Handle call connected |
| `POST /api/exotel/completed` | Handle call completed |
| `POST /api/exotel/missed` | Handle missed calls |

### Sample Webhook Payloads

**Incoming Call:**
```json
{
  "CallSid": "CALL_abc123",
  "From": "+919876543210"
}
```

**Call Connected:**
```json
{
  "CallSid": "CALL_abc123",
  "Status": "in-progress"
}
```

**Call Completed:**
```json
{
  "CallSid": "CALL_abc123",
  "Status": "completed",
  "Duration": "120"
}
```

## Queue Engine Logic

1. Incoming call → Check for available employees
2. If available → Assign to **longest-idle** employee
3. If all busy → Add to **FIFO queue**
4. When call completes → Employee freed → Auto-assign oldest queued caller

## Project Structure

```
kaifan/
├── backend/
│   └── src/main/java/com/kaifan/callqueue/
│       ├── config/          # Security, WebSocket, OpenAPI configs
│       ├── controller/      # REST controllers
│       ├── dto/             # Request/Response DTOs
│       ├── entity/          # JPA entities
│       ├── exception/       # Global exception handling
│       ├── mapper/          # MapStruct mappers
│       ├── repository/      # Spring Data repositories
│       ├── security/        # JWT auth components
│       ├── service/         # Business logic interfaces + impls
│       ├── telephony/       # Provider abstraction + Exotel impl
│       └── websocket/       # WebSocket event publisher
├── frontend/
│   └── src/
│       ├── api/             # Axios + API endpoints
│       ├── components/      # Layout, shared components
│       ├── hooks/           # WebSocket hook
│       ├── pages/           # Dashboard, Calls, Queue, Employees, Audit
│       ├── stores/          # Zustand stores
│       ├── theme/           # MUI theme
│       └── types/           # TypeScript types
├── nginx/                   # Reverse proxy config
├── docker-compose.yml
└── README.md
```

## Telephony Abstraction

Business logic depends on `TelephonyProvider` interface, not on Exotel directly:

```java
public interface TelephonyProvider {
    void handleIncomingCall(String callSid, String phoneNumber);
    void handleCallConnected(String callSid);
    void handleCallCompleted(String callSid);
    void handleCallMissed(String callSid);
}
```

To switch providers, implement the interface (e.g., `TwilioTelephonyProvider`) and swap the bean.

## WebSocket Events

| Event | Trigger |
|-------|---------|
| `NEW_CALL` | Incoming call received |
| `CALL_CONNECTED` | Call answered |
| `CALL_COMPLETED` | Call ended |
| `CALL_MISSED` | Call missed |
| `QUEUE_UPDATED` | Queue state changed |
| `EMPLOYEE_STATUS_CHANGED` | Employee status toggled |

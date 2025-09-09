# SonoCode - WebSocket Service

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

This microservice provides real-time, bidirectional communication capabilities for the SonoCode platform. It manages persistent WebSocket connections with clients, enabling instant delivery of code evaluation results and other critical status updates.

---

## Core Responsibilities

* **Connection Management:** Establishes and maintains persistent WebSocket connections with clients using Socket.io.

* **Real-time Event Broadcasting:** Pushes asynchronous updates (e.g., submission results) from the backend directly to the appropriate client without needing the client to poll for changes.

* **Scalable Session Handling:** Uses Redis to manage the mapping of users to their active socket connections, a critical feature for scalability.

---

## 🔌 Socket Events

The service primarily listens for an inbound API call to broadcast results and manages two main socket events.

### Inbound (via REST API)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/results` | An internal endpoint called by the `Submission Service` to push a result payload to a specific user. |

### Outbound (to Client)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `connect` | `{ }` | Emitted when a client successfully establishes a connection. |
| `submission:result` | `Submission` | Emitted to a specific client when the result of their code submission is ready. Contains the final status, output, and other details. |

---

## 💡 System Design Pointers

* **Dedicated Responsibility for Real-time Communication:** In a microservices architecture, isolating the WebSocket connection logic into a dedicated service is a strategic design choice. It prevents the main API gateways or business-logic services from being burdened with managing thousands of long-lived, stateful connections.

* **Horizontal Scalability:** Using Redis as a centralized store for connection data is the key to making this service horizontally scalable. You can run multiple instances of the `Socket Service` behind a load balancer. When the `Submission Service` needs to send a result, any `Socket Service` instance can look up the user's `socketId` in Redis and push the message, regardless of which instance is holding the actual connection. This is a powerful pattern for building resilient, high-availability systems.

* **Push vs. Pull Model:** This service transforms the platform from a "pull" model (where the client must repeatedly ask "is it done yet?") to a "push" model (where the server says "here is your result"). This is far more efficient in terms of network and server resources and provides a superior user experience.

---

## ✨ Advanced Backend Concepts Implemented

This service is more than just a simple WebSocket server; it demonstrates several advanced engineering patterns for building scalable, real-time systems.

* **Stateful Connection Management:** While the service itself is stateless, it manages stateful client connections. By storing the `userId` to `socketId` mapping in a **distributed Redis cache**, the system can identify which client to send a message to, even if there are thousands of active connections across multiple service instances.

* **Decoupling via API:** The service does not initiate business logic. Instead, it exposes an internal REST endpoint (`/api/v1/results`). This decouples it from the `Submission Service`. The `Submission Service` simply makes an HTTP request when a result is ready, and the `Socket Service` handles the complexity of finding the right client and pushing the update.

* **Real-time Event-Driven Architecture:** This service is a cornerstone of the platform's reactive design. It allows the backend to proactively push information to the user, providing an instant, modern user experience that would be impossible to achieve with traditional request-response patterns.


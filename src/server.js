const express = require("express");
const { createServer } = require('http');
const { Server } = require("socket.io");
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


const httpServer = createServer(app);

const redisCache = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379'); // create redis client

// Allow configuring CORS origins via environment variable (comma-separated)
const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
    : "*";

const io = new Server(httpServer, { 
    cors: {
        origin: configuredOrigins,
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("A user connected" + socket.id);
    //emitted by client
    //setting user id to connection id
    socket.on("setUserId", (userId) => {
        redisCache.set(userId, socket.id);
    });

    // emitted by client
    // fetching connection id of user
    socket.on('getConnectionId', async (userId) => {
        const connId = await redisCache.get(userId);
        socket.emit('connectionId', connId);
    });
});

app.post('/sendPayload', async (req, res) => {
    const { userId, payload } = req.body;
    if(!userId || !payload) {
        return res.status(400).send("Invalid request");
    }

    const socketId = await redisCache.get(userId);

    if(socketId) {
        io.to(socketId).emit('submissionPayloadResponse', payload);
        return res.send("Payload sent successfully");
    } else {
        return res.status(404).send("User not connected");
    }
});

// Simple health endpoint for load balancers and uptime checks
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 4003;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
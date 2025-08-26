const express = require("express");
const { createServer } = require('http');
const { Server } = require("socket.io");
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json);

const httpServer = createServer(app);

const redisCache = new Redis(); // create redis client

const io = new Server(httpServer, { });

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
        res.status(400).send("Invalid request");
    }

    const socketId = await redisCache.get(userId);

    if(socketId) {
        io.to(socketId).emit('submissionPayloadResponse', payload);
        res.send("Payload sent successfully");
    } else {
        res.status(404).send("User not connected");
    }
});

httpServer.listen(4003, () => {
    console.log("Server is running on port 4003");
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('message', (msg) => {
        console.log(`Message from ${socket.id}:`, msg);
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

if (require.main === module) {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = { app, server };

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const port = process.env.PORT || 5001;
const app = express();
const server = http.createServer(app);

// ✅ Allow WebSocket connections from frontend (CORS fix)
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (change this for security in production)
        methods: ["GET", "POST"]
    }
});

// ✅ Serve public frontend files
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("message", (msg) => {
        console.log(`Message from ${socket.id}:`, msg);
        io.emit("message", msg);
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

// ✅ Ensure server listens on `0.0.0.0` for Docker compatibility
server.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});


module.exports = { app, server };

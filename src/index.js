const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require('cors');
const port = process.env.PORT || 5001;
const app = express();
const server = http.createServer(app);
const pg = require("./services/pgClient"); // ✅ PostgreSQL Pool


// ✅ Middleware: Parse incoming JSON (needed for POST bodies)
app.use(express.json());

app.use(cors({
    origin: ["http://localhost:5001", "http://0.0.0.0:5001"],
    methods: ["GET", "POST"],
    credentials: false,
  }));

// ✅ Register chat routes
const chatRoutes = require('./routes/chat');
app.use("/api/chat", chatRoutes);

// ✅ User route
const userRoutes = require('./routes/user');
app.use("/api/user", userRoutes);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ✅ Serve frontend files
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("message", async (msg) => {
        console.log(`Message from ${socket.id}:`, msg);

        io.emit("message", msg);
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});

module.exports = { app, server };


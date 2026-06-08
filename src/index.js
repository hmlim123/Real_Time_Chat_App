require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const path = require("path");
const cors = require('cors');
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5002;
const app = express();
const server = http.createServer(app);
const pg = require("./services/pgClient");
const redisClient = require("./services/redisClient");


// ✅ Middleware: Parse incoming JSON (needed for POST bodies)
app.use(express.json());

app.use(cors({
  origin: ["http://localhost:3000", "https://real-time-chat-frontend-aohyiyqsx-aiden-lim-s-projects.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true,
}));


// ✅ Register chat routes
const chatRoutes = require('./routes/chat');
app.use("/api/chat", chatRoutes);

// ✅ User route
const userRoutes = require('./routes/user');
app.use("/api/user", userRoutes);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://real-time-chat-frontend-aohyiyqsx-aiden-lim-s-projects.vercel.app"],
        methods: ["GET", "POST"]
    }
});

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pg.query("SELECT id, username FROM users WHERE id = $1", [decoded.id]);
        if (!result.rows[0]) return next(new Error("User not found"));
        socket.user = result.rows[0];
        next();
    } catch {
        next(new Error("Invalid token"));
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
    
    socket.on("join", (roomId) => {
        socket.join(roomId);
        console.log(`🛏️ Socket ${socket.id} joined room: ${roomId}`);

        io.to(roomId).emit("system_message", {
            type: "join",
            message: `${socket.user.username} joined the room`,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on("leave", (roomId) => {
        socket.leave(roomId);
        console.log(`🚪 Socket ${socket.id} left room: ${roomId}`);

        io.to(roomId).emit("system_message", {
            type: "leave",
            message: `${socket.user.username} left the room`,
            timestamp: new Date().toISOString(),
        });
    });



    socket.on("message", async (data) => {
        const { message, roomId } = data;
        const { id: userId, username } = socket.user;

        try {
            const roomResult = await pg.query(
                "INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
                [roomId]
            );
            const dbRoomId = roomResult.rows[0].id;

            const savedMessage = await pg.query(
                `INSERT INTO messages (user_id, content, room_id)
                VALUES ($1, $2, $3)
                RETURNING content, created_at`,
                [userId, message, dbRoomId]
            );

            io.to(roomId).emit("message", {
                username,
                message: savedMessage.rows[0].content,
                created_at: savedMessage.rows[0].created_at
            });
        } catch (err) {
            console.error("❌ Error saving message from socket:", err);
        }
    });

    socket.on("typing", ({ roomId }) => {
        socket.to(roomId).emit("user_typing", { username: socket.user.username });
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

async function initRedis() {
    try {
        const subClient = redisClient.duplicate();
        await Promise.all([redisClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(redisClient, subClient));
        console.log("✅ Socket.IO Redis adapter ready");
    } catch (err) {
        console.warn("⚠️  Redis unavailable — running single-process:", err.message);
    }
}

function startServer() {
    initRedis().then(() => {
        server.listen(port, "0.0.0.0", () => {
            console.log(`Server running at http://0.0.0.0:${port}`);
        });
    });
    return server;
}

async function stopServer() {
    server.close();
    if (redisClient.isOpen) await redisClient.quit();
}

if (require.main === module) {
    startServer();
}

module.exports = { app, server, startServer, stopServer };


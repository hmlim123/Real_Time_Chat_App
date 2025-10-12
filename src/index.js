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
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true, // optional, if using cookies later
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

    socket.on("join", (roomId) => {
        socket.join(roomId);
        console.log(`🛏️ Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on("leave", (roomId) => {
        socket.leave(roomId);
        console.log(`🚪 Socket ${socket.id} left room: ${roomId}`);
    });


    socket.on("message", async (data) => {
        const { username, message, roomId } = data;
    
        try {
            const userResult = await pg.query(
                "SELECT id FROM users WHERE username = $1",
                [username]
            );
    
            const userId = userResult.rows[0]?.id;
            if (!userId) {
                console.warn("Unknown username:", username);
                return;
            }
    
            // Check if room exists; if not, create it
            const roomResult = await pg.query(
            "INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
            [data.roomId]
            );
            const roomId = roomResult.rows[0].id;

            // Save the message with room_id
            const savedMessage = await pg.query(
            `INSERT INTO messages (user_id, content, room_id)
            VALUES ($1, $2, $3)
            RETURNING content, created_at`,
            [userId, message, roomId]
            );


            io.to(data.roomId).emit("message", {
            username,
            message: savedMessage.rows[0].content,
            created_at: savedMessage.rows[0].created_at
            });




        } catch (err) {
            console.error("❌ Error saving message from socket:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});

module.exports = { app, server };


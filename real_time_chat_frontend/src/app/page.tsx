"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useRef } from "react";


export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [rooms, setRooms] = useState<string[]>([]); // 🆕 for sidebar list
  const [input, setInput] = useState("");
  const [joined, setJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);


  // 🧠 Fetch message history whenever user joins a room
  useEffect(() => {
    if (!joined || !roomId) return;

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:5001/api/chat/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("❌ Failed to load messages:", err);
      }
    })();
  }, [joined, roomId]);

  // 🧩 Listen for incoming socket messages and system messages
useEffect(() => {
  if (!socket) return;

  socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));

  socket.on("system_message", (msg) => {
    setMessages((prev) => [
      ...prev,
      { system: true, content: msg.message, timestamp: msg.timestamp },
    ]);
  });

  // 🆕 Typing indicator listener
  socket.on("user_typing", ({ username }) => {
    setTypingUser(username);
    setTimeout(() => setTypingUser(null), 2000); // clears after 2s
  });

  return () => {
    socket.off("message");
    socket.off("system_message");
    socket.off("user_typing");
  };
}, [socket]);


useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);


  // 🟢 Login or register automatically
  const handleJoin = async () => {
    const email = `${username}@test.com`;
    const password = "test1234";

    let res = await fetch("http://localhost:5001/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data = await res.json();

    if (!res.ok) {
      console.log("🔁 User not found, registering instead...");
      res = await fetch("http://localhost:5001/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      data = await res.json();

      if (!res.ok) {
        alert(`Failed to register: ${data.error}`);
        return;
      }
    }

    const token = data.user.token;
    const user = data.user;

    localStorage.setItem("token", token);
    localStorage.setItem("username", user.username);

    const newSocket = io("http://localhost:5001", {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected as:", user.username);
      newSocket.emit("join", roomId);
      setJoined(true);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection failed:", err.message);
      alert("Socket authentication failed. Please refresh or log in again.");
    });

    setSocket(newSocket);
  };

  // 🆕 Step 3 (Optional): Fetch list of rooms for sidebar
  useEffect(() => {
    if (!joined) return;
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/api/chat/rooms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRooms(data.map((r: any) => r.name)))
      .catch((err) => console.error("❌ Failed to fetch rooms:", err));
  }, [joined]);

  // 📨 Send a message
  const sendMessage = () => {
    if (!socket || !input.trim()) return;
    socket.emit("message", {
      roomId,
      message: input,
      username,
    });
    setInput("");
  };

  // 🚪 Log out
  const handleLogout = () => {
    localStorage.clear();
    setJoined(false);
    setMessages([]);
    if (socket) socket.disconnect();
    setSocket(null);
  };

  // 🧱 Login/Join UI
  if (!joined) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-3">
        <h1 className="text-3xl font-bold text-blue-600">Join Chat</h1>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleJoin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Join Room
        </button>
      </main>
    );
  }

  // 💬 Chat UI with sidebar (Step 3)
  return (
    <main className="flex min-h-screen p-4">
      {/* 🆕 Sidebar */}
      <aside className="w-1/4 border-r pr-4">
        <h2 className="font-bold mb-2">Rooms</h2>
        {rooms.map((r) => (
          <div
            key={r}
            onClick={() => {
              if (socket) {
                socket.emit("leave", roomId);
                socket.emit("join", r);
              }
              setRoomId(r);
            }}
            className={`cursor-pointer p-2 rounded ${
              r === roomId ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            {r}
          </div>
        ))}
      </aside>

      {/* 🧩 Chat Area */}
      <section className="flex-1 flex flex-col items-center justify-center">
        <div className="flex justify-between w-full max-w-md mb-4">
          <h1 className="text-2xl font-bold text-blue-600">Room: {roomId}</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Log Out
          </button>
        </div>

        <div className="w-full max-w-md border rounded-md p-4 mb-4 h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`text-sm ${msg.system ? "text-gray-500 italic" : "text-black"}`}
          >
            {msg.system ? (
              <>
                🕓 <span className="text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>{" "}
                — {msg.content}
              </>
            ) : (
              <>
                <strong>{msg.username || "Anonymous"}:</strong>{" "}
                {msg.content || msg.message}{" "}
                <span className="text-xs text-gray-400">
                  ({new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </>
            )}
          </p>
        ))}

        {/* 🧩 Auto-scroll anchor */}
        <div ref={messagesEndRef} />

        </div>

        {typingUser && (
          <p className="text-sm italic text-gray-500 mb-2">
            {typingUser} is typing...
          </p>
        )}

        <div className="flex w-full max-w-md">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (socket && roomId && username) {
                socket.emit("typing", { roomId, username });
              }
            }}
            placeholder="Type a message..."
            className="flex-1 border p-2 rounded-l-md"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </section>
    </main>
  );
}







"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [joined, setJoined] = useState(false);

  // Fetch history when joined
  useEffect(() => {
    if (!joined || !roomId) return;

    async function fetchMessages() {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);
    }

    fetchMessages();

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("message");
  }, [joined, roomId]);

  // Handle registration
  const registerUser = async () => {
    const email = `${username}@test.com`;
    const password = "test1234";
    const res = await fetch("http://localhost:5001/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (res.status === 201) {
      localStorage.setItem("token", data.user.token);
      localStorage.setItem("username", data.user.username);
      socket.emit("join", roomId);
      setJoined(true);
    } else {
      alert(`Failed: ${data.error}`);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("message", {
      username,
      message: input,
      roomId,
    });
    setInput("");
  };

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
          onClick={registerUser}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Join Room
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Room: {roomId}</h1>
      <div className="w-full max-w-md border rounded-md p-4 mb-4 h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <p key={i}>
            <strong>{msg.username}:</strong> {msg.content || msg.message}
          </p>
        ))}
      </div>
      <div className="flex w-full max-w-md">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
    </main>
  );
}



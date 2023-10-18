import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/AuthRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";

import globalErrorHandler from "./controllers/errorController.js";
import { Server } from "socket.io";

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// upload route
app.use("/uploads/recordings", express.static("uploads/recordings"));
app.use("/uploads/images", express.static("uploads/images"));

// routes
app.use("/api/message", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/health", (req, res) => res.send("Server is live and running ✅"));

app.use("*", (req, res) => {
  res.status(400).json({
    status: false,
    msg: "url you are looking not found on server",
  });
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () =>
  console.log(`Server Listening at port ${PORT} ✅`)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});

const io = new Server(server, {
  cors: {
    origin: "https://whatsapp-chi-steel.vercel.app",
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);

    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers?.keys()),
    });
  });

  socket.on("signout", (id) => {
    onlineUsers?.delete(id);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers?.keys()),
    });
  });

  socket.on("send-msg", (data) => {
    const toUserOnline = onlineUsers.get(data.to);

    if (toUserOnline) {
      socket.to(toUserOnline).emit("msg-recieved", {
        from: data.from,
        message: data.message,
      });
    }
  });

  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-voice-call", {
        from: data?.from,
        roomId: data?.roomId,
        callType: data?.callType,
      });
    }
  });

  socket.on("outgoing-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-video-call", {
        from: data?.from,
        roomId: data?.roomId,
        callType: data?.callType,
      });
    }
  });

  socket.on("reject-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("voice-call-rejected");
    }
  });
  socket.on("reject-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("video-call-rejected");
    }
  });

  socket.on("accept-incoming-call", ({ id }) => {
    const sendUserSocket = onlineUsers.get(id);
    if (sendUserSocket) socket.to(sendUserSocket).emit("accept-call");
  });
});

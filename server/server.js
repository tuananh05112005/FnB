require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const { initDB } = require("./config/db");

const port = process.env.PORT || 5000;

initDB();

// Tạo HTTP server
const server = http.createServer(app);

// Gắn Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Global để controller dùng
global.io = io;

// Khi client connect
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// KHÔNG dùng app.listen nữa
server.listen(port, () => {
  console.log(`Server dang chay tai http://localhost:${port}`);
});
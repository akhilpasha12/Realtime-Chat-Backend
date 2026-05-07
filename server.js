require("dotenv").config();

const express = require("express");
const connectDB = require("./src/config/db");

connectDB();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const chatSocket = require("./src/sockets/chatSocket");
const authRoutes = require("./src/routes/authRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "",
  },
});

chatSocket(io);

app.get("/", (req, res) => {
  res.send("Welcome to the real-time chat server");
});
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
const PORT = process.env.PORT || 9000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

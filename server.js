// require("dotenv").config();

// const express = require("express");
// const connectDB = require("./src/config/db");
// const http = require("http");
// const cors = require("cors");
// const { Server } = require("socket.io");
// const cron = require("node-cron");
// const axios = require("axios");

// const chatSocket = require("./src/sockets/chatSocket");
// const authRoutes = require("./src/routes/authRoutes");
// const messageRoutes = require("./src/routes/messageRoutes");
// const userRoutes = require("./src/routes/userRoutes");

// connectDB();

// const app = express();

// // ─── CORS ─────────────────────────────────────────────────────────────────────
// app.use(
//   cors({
//     origin: "*", // React Native apps don't have an origin — keep as *
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   }),
// );

// app.use(express.json());

// // ─── HTTP + Socket.IO ─────────────────────────────────────────────────────────
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*", // ✅ allow React Native app to connect
//     methods: ["GET", "POST"],
//   },
//   transports: ["websocket", "polling"], // ✅ fallback to polling if websocket fails
// });

// chatSocket(io);

// // ─── Routes ───────────────────────────────────────────────────────────────────
// app.get("/", (req, res) => {
//   res.send("Welcome to the real-time chat server");
// });

// // ✅ Health check — required for keep-alive ping
// app.get("/health", (req, res) => {
//   res.json({ status: "ok", uptime: process.uptime() });
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/users", userRoutes);

// // ─── Keep Render awake (free tier) ────────────────────────────────────────────
// const RENDER_URL = process.env.RENDER_URL || "https://your-app.onrender.com";

// cron.schedule("*/10 * * * *", async () => {
//   try {
//     await axios.get(`${RENDER_URL}/health`);
//     console.log("[cron] keep-alive ping sent");
//   } catch (err) {
//     console.error("[cron] ping failed:", err.message);
//   }
// });

// // ─── Start ────────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 9000;

// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}`);
// });
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const cron = require("node-cron");
const axios = require("axios");

const connectDB = require("./src/config/db");
const chatSocket = require("./src/sockets/chatSocket");
const authRoutes = require("./src/routes/authRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const userRoutes = require("./src/routes/userRoutes");

connectDB();
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

chatSocket(io);

app.get("/", (req, res) => res.send("Realtime Chat Server ✅"));
app.get("/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() }),
);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

const RENDER_URL = process.env.RENDER_URL;
if (RENDER_URL) {
  cron.schedule("*/10 * * * *", async () => {
    try {
      await axios.get(`${RENDER_URL}/health`);
      console.log("[cron] alive ✅");
    } catch (e) {
      console.error("[cron] ping failed:", e.message);
    }
  });
}

const PORT = process.env.PORT || 9000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server on port ${PORT}`));

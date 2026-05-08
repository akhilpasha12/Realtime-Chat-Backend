const Message = require("../models/Message");
const User = require("../models/User");

const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", async (userId) => {
      if (!userId) return;
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { online: true, socketId: socket.id });
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("send_message", async (data) => {
      try {
        const newMessage = await Message.create({
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          type: "text",
        });
        const msgObj = newMessage.toObject();
        io.to(data.receiverId).emit("receive_message", msgObj);
        io.to(data.senderId).emit("message_sent", msgObj);
      } catch (err) {
        socket.emit("message_error", { error: err.message });
      }
    });

    socket.on("live_location", async (data) => {
      try {
        if (!data.location || typeof data.location.latitude !== "number") {
          socket.emit("message_error", { error: "Invalid location" });
          return;
        }
        const newMessage = await Message.create({
          senderId: data.senderId,
          receiverId: data.receiverId,
          type: "location",
          message: "",
          location: { latitude: data.location.latitude, longitude: data.location.longitude },
        });
        const msgObj = newMessage.toObject();
        io.to(data.receiverId).emit("receive_message", msgObj);
        io.to(data.senderId).emit("message_sent", msgObj);
      } catch (err) {
        socket.emit("message_error", { error: err.message });
      }
    });

    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      io.to(receiverId).emit("typing", { senderId, isTyping });
    });

    socket.on("disconnect", async () => {
      const userId = [...onlineUsers.entries()].find(([, sid]) => sid === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { online: false, socketId: null });
        io.emit("online_users", Array.from(onlineUsers.keys()));
      }
    });
  });
};

module.exports = chatSocket;

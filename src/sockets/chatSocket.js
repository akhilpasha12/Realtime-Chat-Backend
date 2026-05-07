const Message = require("../models/Message");

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("send_message", async (data) => {
      const newMessage = await Message.create({
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
        type: "text",
      });

      io.emit("receive_message", newMessage);
    });

    socket.on("live_location", async (data) => {
      const newMessage = await Message.create({
        senderId: data.senderId,
        receiverId: data.receiverId,
        type: "location",
        location: data.location,
      });

      io.emit("receive_message", newMessage);
    });
  });
};

module.exports = chatSocket;

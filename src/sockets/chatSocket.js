// const Message = require("../models/Message");
// const User = require("../models/User");

// const onlineUsers = new Map();

// const chatSocket = (io) => {
//   io.on("connection", (socket) => {
//     console.log("Client connected:", socket.id);

//     socket.on("join", async (userId) => {
//       if (!userId) return;
//       socket.join(userId);
//       onlineUsers.set(userId, socket.id);
//       await User.findByIdAndUpdate(userId, { online: true, socketId: socket.id });
//       io.emit("online_users", Array.from(onlineUsers.keys()));
//     });

//     socket.on("send_message", async (data) => {
//       try {
//         const newMessage = await Message.create({
//           senderId: data.senderId,
//           receiverId: data.receiverId,
//           message: data.message,
//           type: "text",
//         });
//         const msgObj = newMessage.toObject();
//         io.to(data.receiverId).emit("receive_message", msgObj);
//         io.to(data.senderId).emit("message_sent", msgObj);
//       } catch (err) {
//         socket.emit("message_error", { error: err.message });
//       }
//     });

//     socket.on("live_location", async (data) => {
//       try {
//         if (!data.location || typeof data.location.latitude !== "number") {
//           socket.emit("message_error", { error: "Invalid location" });
//           return;
//         }
//         const newMessage = await Message.create({
//           senderId: data.senderId,
//           receiverId: data.receiverId,
//           type: "location",
//           message: "",
//           location: { latitude: data.location.latitude, longitude: data.location.longitude },
//         });
//         const msgObj = newMessage.toObject();
//         io.to(data.receiverId).emit("receive_message", msgObj);
//         io.to(data.senderId).emit("message_sent", msgObj);
//       } catch (err) {
//         socket.emit("message_error", { error: err.message });
//       }
//     });

//     socket.on("typing", ({ senderId, receiverId, isTyping }) => {
//       io.to(receiverId).emit("typing", { senderId, isTyping });
//     });

//     socket.on("disconnect", async () => {
//       const userId = [...onlineUsers.entries()].find(([, sid]) => sid === socket.id)?.[0];
//       if (userId) {
//         onlineUsers.delete(userId);
//         await User.findByIdAndUpdate(userId, { online: false, socketId: null });
//         io.emit("online_users", Array.from(onlineUsers.keys()));
//       }
//     });
//   });
// };

// module.exports = chatSocket;
const Message = require("../models/Message");

const User = require("../models/User");

const admin = require("../../firebase");

const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("[Socket] client connected:", socket.id);

    // JOIN
    socket.on("join", async (userId) => {
      try {
        if (!userId) return;

        console.log("[Socket] join user:", userId);

        socket.join(userId);

        onlineUsers.set(userId, socket.id);

        await User.findByIdAndUpdate(userId, {
          online: true,
          socketId: socket.id,
        });

        io.emit("online_users", Array.from(onlineUsers.keys()));

        console.log("[Socket] online users updated");
      } catch (err) {
        console.log("[Socket] join error:", err);
      }
    });

    // SEND TEXT MESSAGE
    socket.on("send_message", async (data) => {
      try {
        console.log("[Socket] send_message:", data);

        const newMessage = await Message.create({
          senderId: data.senderId,

          receiverId: data.receiverId,

          message: data.message,

          type: "text",
        });

        const msgObj = newMessage.toObject();

        // REALTIME SOCKET MESSAGE
        io.to(data.receiverId).emit("receive_message", msgObj);

        io.to(data.senderId).emit("message_sent", msgObj);

        console.log("[Socket] realtime message emitted");

        // PUSH NOTIFICATION
        const receiver = await User.findById(data.receiverId);

        const isReceiverOnline = onlineUsers.has(data.receiverId);

        // SEND PUSH ONLY IF:
        // 1. receiver offline
        // 2. token exists
        // 3. sender != receiver
        if (
          !isReceiverOnline &&
          receiver?.fcmToken &&
          data.senderId !== data.receiverId
        ) {
          console.log("[FCM] sending push notification...");

          await admin.messaging().send({
            token: receiver.fcmToken,

            notification: {
              title: "New Message",

              body: data.message,
            },

            data: {
              senderId: data.senderId.toString(),

              receiverId: data.receiverId.toString(),

              type: "chat",
            },
          });

          console.log("[FCM] push notification sent");
        } else {
          console.log("[FCM] skipped (receiver online or token missing)");
        }
      } catch (err) {
        console.log("[Socket] send_message error:", err);

        socket.emit("message_error", {
          error: err.message,
        });
      }
    });

    // LIVE LOCATION
    socket.on("live_location", async (data) => {
      try {
        console.log("[Socket] live_location:", data);

        if (!data.location || typeof data.location.latitude !== "number") {
          socket.emit("message_error", {
            error: "Invalid location",
          });

          return;
        }

        const newMessage = await Message.create({
          senderId: data.senderId,

          receiverId: data.receiverId,

          type: "location",

          message: "",

          location: {
            latitude: data.location.latitude,

            longitude: data.location.longitude,
          },
        });

        const msgObj = newMessage.toObject();

        // REALTIME SOCKET MESSAGE
        io.to(data.receiverId).emit("receive_message", msgObj);

        io.to(data.senderId).emit("message_sent", msgObj);

        console.log("[Socket] location message emitted");

        // PUSH NOTIFICATION
        const receiver = await User.findById(data.receiverId);

        const isReceiverOnline = onlineUsers.has(data.receiverId);

        if (
          !isReceiverOnline &&
          receiver?.fcmToken &&
          data.senderId !== data.receiverId
        ) {
          await admin.messaging().send({
            token: receiver.fcmToken,

            notification: {
              title: "Live Location",

              body: "Shared a location",
            },

            data: {
              senderId: data.senderId.toString(),

              receiverId: data.receiverId.toString(),

              type: "location",
            },
          });

          console.log("[FCM] location push sent");
        } else {
          console.log("[FCM] location push skipped");
        }
      } catch (err) {
        console.log("[Socket] live_location error:", err);

        socket.emit("message_error", {
          error: err.message,
        });
      }
    });

    // TYPING
    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      console.log("[Socket] typing:", senderId, isTyping);

      io.to(receiverId).emit("typing", {
        senderId,
        isTyping,
      });
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      try {
        console.log("[Socket] disconnected:", socket.id);

        const userId = [...onlineUsers.entries()].find(
          ([, sid]) => sid === socket.id,
        )?.[0];

        if (userId) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            online: false,
            socketId: null,
          });

          io.emit("online_users", Array.from(onlineUsers.keys()));

          console.log("[Socket] user offline:", userId);
        }
      } catch (err) {
        console.log("[Socket] disconnect error:", err);
      }
    });
  });
};

module.exports = chatSocket;
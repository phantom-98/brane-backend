const helperFunctions = require("./utils");

const joinRoom = (socket, io, users, socketToRoom) => {
  socket.on("join-room", ({roomId, peerId, user}) => {
    try {
      console.log("new user joined the room", roomId, peerId, user);

      // Store the user's socket id in the users object with the key as userID
      helperFunctions.appendUser(users, roomId, peerId, user, socket.id);
      socketToRoom[socket.id] = roomId;
      // It lets the user join the room
      socket.join(roomId);
      
      socket.emit("all-users", users[roomId]);
      socket.to(roomId).emit("user-joined", {roomId, peerId, ...user});
      console.log("emit all-users event to user", roomId, users[roomId])
    } catch (err) {
      console.log("Error in join-room: ", err);
    }
  });
};

const readyRoom = (socket) => {
  socket.on("am-ready", ({roomId, peerId, user}) => {
    try {
      console.log("user is ready", roomId, peerId, user);
      socket.to(roomId).emit("user-ready", {roomId, peerId, ...user});
    } catch (err) {
      console.log("Error in ready-room: ", err);
    }
  });
};

const disconnect = (socket, io, users, socketToRoom) => {
  socket.on("disconnect", () => {
    try {
      const roomID = socketToRoom[socket.id];
      delete socketToRoom[socket.id];
      socket.leave(roomID);
      if (roomID) {
        const user = helperFunctions.findUserBySocketId(
          users,
          roomID,
          socket.id
        );
        const usersInThisRoom = helperFunctions.filterUsers(
          users,
          roomID,
          socket.id
        );
        if (usersInThisRoom.length === 0) {
          delete users[roomID];
        } else {
          users[roomID] = usersInThisRoom;
          io.to(roomID).emit("user-left", user);
          console.log("user left", roomID, user);
        }
      }
    } catch (err) {
      console.log("Error in disconnect: ", err);
    }
  });
};

const sendMessage = (socket, io, socketToRoom) => {
  socket.on("send-message", (payload) => {
    try {
      io.to(socketToRoom[socket.id]).emit("message", payload);
      console.log("message sent to room", socketToRoom[socket.id], payload);
    } catch (err) {
      console.log("Error in send message: ", err);
    }
  });
};

const sendSignals = (socket, io, socketToRoom) => {
  socket.on("send-signal", (payload) => {
    try {
      io.to(socketToRoom[socket.id]).emit("signals", payload);
      console.log("signal sent to room", socketToRoom[socket.id], payload);
    } catch (err) {
      console.log("Error in send signal: ", err);
    }
  });
};

const socketFunctions = {
  joinRoom,
  readyRoom,
  disconnect,
  sendMessage,
  sendSignals,
};

module.exports = socketFunctions;

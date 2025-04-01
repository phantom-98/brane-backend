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
      if (roomId === peerId) {
        strapi.db.connection.raw(
          "UPDATE components_course_conferences SET state = 'in_progress' WHERE meeting_id = '" + roomId + "';"
        ).then(res => {console.log("update meet", res)}).catch(err => console.log("error updating meet", err));
      }
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

const disconnect = (socket, io, users, socketToRoom, stream, strapi) => {
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
          //save video stream and delete entry
          helperFunctions.saveAndRemoveStream(roomID, stream);
          strapi.db.connection.raw(
            "UPDATE components_course_conferences SET state = 'completed' WHERE meeting_id = '" + roomID + "';"
          ).then(res => {console.log("update meet", res)}).catch(err => console.log("error updating meet", err));
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

const getStream = (socket, stream) => {
  socket.on("stream", ({roomId, peerId, chunk}) => {
    try {
      console.log("getting stream chunk", roomId, peerId);
      if (roomId !== peerId) return;
      if (stream[roomId]) {
        stream[roomId].push(chunk)
      } else {
        stream[roomId] = [chunk];
      }
    } catch (err) {
      console.log("Error in ready-room: ", err);
    }
  });
}

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
  getStream,
  disconnect,
  sendMessage,
  sendSignals,
};

module.exports = socketFunctions;

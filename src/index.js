'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    const io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        origin: "*",
        transports: ["websocket"]
      }
    });
    const socketFunctions = require("./socket/sockets");

    const users = {};
    const socketToRoom = {};

    io.on("connection", (socket) => {
      socketFunctions.joinRoom(socket, io, users, socketToRoom);
      socketFunctions.readyRoom(socket);
      socketFunctions.disconnect(socket, io, users, socketToRoom);
      socketFunctions.sendMessage(socket, io, socketToRoom);
      socketFunctions.sendSignals(socket, io, socketToRoom);
    });
  },
};

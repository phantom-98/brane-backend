const fs = require('fs-extra');

const getHostUser = (users, roomId) => {
  if (users[roomId]) {
    const user = users[roomId].find((user) => user.peerId === roomId);
    return user;
  }
  return undefined;
};

const appendUser = (users, roomId, peerId, user, socketId) => {
  if (users[roomId]) {
    users[roomId].push({ socketId, peerId, ...user });
  } else {
    users[roomId] = [{ socketId, peerId, ...user }];
  }
};

const appendMultiUsers = (users, roomId, newUsers) => {
  if (users[roomId]) {
    newUsers.forEach((u) => {
      if (users[roomId].find(user => user.peerId === u.peerId)) {
        u.dup = true;
      }
    });
    newUsers = newUsers.filter(u => !u.dup);
    users[roomId] = [...users[roomId], ...newUsers];
  } else {
    users[roomId] = [...newUsers];
  }
}

const filterUsers = (users, roomId, socketId) => {
  if (users[roomId]) {
    return users[roomId].filter((user) => user.socketId !== socketId);
  }
  return [];
};

const findUserByPeerId = (users, roomId, peerId) => {
  if (users[roomId]) {
    const user = users[roomId].find((user) => user.peerId === peerId);
    return user;
  }
  return undefined;
};

const findUserBySocketId = (users, roomId, socketId) => {
  if (users[roomId]) {
    const user = users[roomId].find((user) => user.socketId === socketId);
    return user;
  }
  return undefined;
};

const saveAndRemoveStream = async (roomId, stream) => {
  if (stream[roomId]) {
    const blob = new Blob(stream[roomId], { type: "video/webm" });
    const buffer = Buffer.from( await blob.arrayBuffer() );
    fs.outputFile('/apenox/records/' + roomId + '.webm', buffer, () => {
      console.log('video saved');
      delete stream[roomId];
    } );
  }
}

const scheduleDeleting = (strapi) => {

  console.log("running scheduled task to delete completed meets")
  strapi.db.connection.raw(
    "SELECT * FROM components_course_conferences WHERE state = 'completed';"
  ).then((data) => {
    const deleted = [];
    console.log("data", data[0]);
    for (let i = 0; i < data[0].length; i++) {
      const { meeting_id, meeting_url, meeting_start, duration, storing_time } = data[0][i];
      if (!meeting_id || !meeting_url || !meeting_start || !duration || !storing_time) continue;
      
      if (new Date(meeting_start).getTime() + Number(duration) * 60 * 1000 + (Number(storing_time) + 1) * 24 * 60 * 60 * 1000 > new Date().getTime()) continue;
      
      const path = '/apenox/records/' + meeting_id + '.webm';
      const r = fs.removeSync(path);
      deleted.push(meeting_id);
    }
    strapi.db.connection.raw(
      "UPDATE components_course_conferences SET state = 'deleted' WHERE meeting_id IN ('" + deleted.join("','") + "');"
    ).then(res => console.log(res)).catch(err => console.log(err))
  }).catch(err => console.log("error selecting completed meets", err));
}

const helperFunctions = {
  getHostUser,
  appendUser,
  appendMultiUsers,
  filterUsers,
  findUserByPeerId,
  findUserBySocketId,
  saveAndRemoveStream,
  scheduleDeleting
};

module.exports = helperFunctions;

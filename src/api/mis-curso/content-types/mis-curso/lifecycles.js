"use strict";

const { v4: uuid } = require("uuid");

module.exports = {
  beforeCreate: async (data) => {
    if (!data.params.data.uuid) {
      data.params.data.uuid = uuid();
    }
  },
};
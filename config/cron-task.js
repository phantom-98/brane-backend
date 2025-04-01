const helperFunctions = require('../src/socket/utils');

module.exports = {
    //everyday at 0:00 am
    "0 0 0 * * *": ({ strapi }) => {
        helperFunctions.scheduleDeleting(strapi);
    },
}
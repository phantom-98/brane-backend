'use strict';

/**
 * support service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::support.support');

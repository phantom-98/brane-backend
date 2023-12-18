'use strict';

/**
 * credit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::credit.credit');

'use strict';

/**
 * cupon service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cupon.cupon');

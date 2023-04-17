'use strict';

/**
 * company-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::company-user.company-user');

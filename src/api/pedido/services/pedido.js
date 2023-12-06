'use strict';

/**
 * pedido service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::pedido.pedido');

'use strict';

/**
 * cupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cupon.cupon',  ({ strapi }) => ({

//modifico el create para que los cupones sean creados solo por usuario de tipo instructor y administrador

async create(ctx){


}





}));

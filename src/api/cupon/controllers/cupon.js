'use strict';

/**
 * cupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cupon.cupon', ({ strapi }) => ({

    //modifico el create para que los cupones sean creados solo por usuario de tipo instructor y administrador

    async create(ctx) {

        // obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //	si el usuario que está haciendo la petición no está logueado, no puede crear el cupon

        if (!user) {

            return ctx.unauthorized(`You can't create this entry`);

        }

        // si el usuario que está haciendo la petición no es instructor ni es administrador, no puede crear el cupon

        if (user.role.type != "instructor" && user.role.type != "administrador") {

            return ctx.unauthorized(`You can't create this entry`);

        }

        // si el usuario que está haciendo la petición es instructor o es administrador, puede crear el cupon

        return await super.create(ctx);

    }
})); 

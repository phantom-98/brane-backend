'use strict';

/**
 * mis-curso controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::mis-curso.mis-curso', ({ strapi }) => ({

//modifico el metodo find para que me traiga los cursos que estan en el usuario logueado
    async find(ctx) {

				const user = ctx.state.user;


					const entries = await strapi.entityService.findMany('api::mis-curso.mis-curso', {

						...ctx.query,

						where: { usuario: user.id },


				});


				return entries;

    }

})
)
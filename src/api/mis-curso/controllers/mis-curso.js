'use strict';

/**
 * mis-curso controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::mis-curso.mis-curso', ({ strapi }) => ({

//modifico el metodo find para que me traiga los cursos que estan en el usuario logueado
    async find(ctx) {


        const { user } = ctx.state;

								const misCursos = await strapi.db
								.query("api::mis-curso.mis-curso")
								.findMany({ where: { usuario: user.id } }); 



								return misCursos;
    }

})
)
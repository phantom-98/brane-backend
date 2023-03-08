'use strict';

/**
 * clases-finalizada controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::clases-finalizada.clases-finalizada', ({ strapi }) => ({

// modifico metodo create para que solo pueda crear clases finalizadas el usuario que esta logueado

async create(ctx) {

const user = ctx.state.user;

// si el usuario que está haciendo la petición no está logueado, no puede crear la clase finalizada
if (!user) {

return ctx.unauthorized(`You can't create this entry`);

}

// inyecto el usuario que está haciendo la petición en el body de la petición
console.log(ctx.request.body);
ctx.request.body.data.usuario = user.id;

// si el usuario que está haciendo la petición no está inscrito en el curso y no es administrador, no puede crear la clase finalizada

const id = ctx.request.body.data.clase;

const misCursos = await strapi.db.query("api::mis-curso.mis-curso").findOne({

where: { usuario: user.id, curso: id },

});

if (!misCursos && user.role.type != "administrador") {

return ctx.unauthorized(`You can't create this entry`);

}

// si el usuario que está haciendo la petición está inscrito en el curso o es administrador, puede crear la clase finalizada

return strapi.entityService.create({ data: ctx.request.body.data });





}
})
)
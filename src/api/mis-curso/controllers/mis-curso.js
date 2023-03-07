'use strict';

/**
 * mis-curso controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::mis-curso.mis-curso', ({ strapi }) => ({

//modifico el metodo find para que me traiga los cursos que estan en el usuario logueado
    async find(ctx) {


        const { user } = ctx.state;

        const entities = await strapi.services['mis-curso'].findMany({ usuario: user.id });

        return entities.map(entity => strapi.services['mis-curso'].sanitizeEntity(entity, { model: strapi.models['mis-curso'] }));
    }

})
)
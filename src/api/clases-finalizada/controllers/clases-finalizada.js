"use strict";

/**
 * clases-finalizada controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::clases-finalizada.clases-finalizada",
  ({ strapi }) => ({
    // modifico metodo create para que solo pueda crear clases finalizadas el usuario que esta logueado

    async create(ctx) {
      const user = ctx.state.user;

      // si el usuario que está haciendo la petición no está logueado, no puede crear la clase finalizada
      if (!user) {
        return ctx.unauthorized(`Inicia sesion para crear la clase finalizada`);
      }
      //obtengo el ususario que esta haciendo la peticion y inyecto el id en el body de la peticion

      ctx.request.body.data.usuario = user.id;

      //inyecto el status  true de la clase finalizada en el body de la peticion

        ctx.request.body.data.status = true;


      // si el usuario que está haciendo la petición no está inscrito en el curso y no es administrador, no puede crear la clase finalizada

      const id = ctx.request.body.data.curso;

      const misCursos = await strapi.db
        .query("api::mis-curso.mis-curso")
        .findOne({
          where: { usuario: user.id, curso: id },
        });
      //console.log(misCursos)
      if (!misCursos && user.role.type != "administrador") {
        return ctx.unauthorized(
          `No tienes permisos para crear la clase finalizada`
        );
      }

      // si el usuario que está haciendo la petición está inscrito en el curso o es administrador, puede crear la clase finalizada

      return await super.create(ctx);
    },

    // modifico el delete para que solo pueda eliminar la clase finalizada el usuario que es dueño de la clase finalizada o el administrador

    async delete(ctx) {

        const user = ctx.state.user;
    
        // si el usuario que está haciendo la petición no está logueado, no puede eliminar la clase finalizada
        if (!user) {
            return ctx.unauthorized(`Inicia sesion para eliminar la clase finalizada`);
        }
    
        // si el usuario que está haciendo la petición no está inscrito en el curso y no es administrador, no puede eliminar la clase finalizada
    
        const id = ctx.params.id;
    
        const claseFinalizada = await strapi.db
            .query("api::clases-finalizada.clases-finalizada")
            .findOne({
            where: { id: id},
            populate: { usuario: true },
            });
        console.log(user.id)
        console.log(claseFinalizada)
        if (user.id != claseFinalizada.usuario.id && user.role.type != "administrador") {
            return ctx.unauthorized(
            `No tienes permisos para eliminar la clase finalizada`
            );
        }
    
        // si el usuario que está haciendo la petición está inscrito en el curso o es administrador, puede eliminar la clase finalizada
    
        return await super.delete(ctx);
        }

        
  })
);

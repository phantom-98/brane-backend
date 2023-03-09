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

      // verifico que la clase finalizada no exista

      const claseFinalizada = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .findOne({
          where: {
            usuario: user.id,
            curso: id,
            clase: ctx.request.body.data.clase,
          },
        });

      if (claseFinalizada) {
        return ctx.unauthorized(`Ya tienes una clase finalizada`);
      }

      //calculo el progreso del curso
      
      const curso = await strapi.db.query("api::curso.curso").findOne({
        where: { id: id },
      });

      const clases = await strapi.db.query("api::clase.clase").findMany({
        where: { curso: id },
      });

      //agrego la clase finalizada
      console.log("este es el body", ctx.request.body.data.clase);
      const claseFinalizadaCreada = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .create({
            data: {
                usuario: user.id,
                curso: id,
                clase: ctx.request.body.data.clase,
                status: true,
            }

        });


      const clasesFinalizadas = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .findMany({
          where: { usuario: user.id, curso: id },
        });
      console.log("esto es clases finalizadas", clases.length);
      const progreso = (clasesFinalizadas.length * 100) / clases.length;
      console.log("este es el progreso", progreso);
      //actualizo el progreso del curso

      const misCurso = await strapi.db
        .query("api::mis-curso.mis-curso")
        .update({
          where: { usuario: user.id, curso: id },
          data: { progress: progreso },
        });

      console.log(misCurso.progress);

      //retorno la clase finalizada con exito 
      
        return claseFinalizadaCreada;
    },

    // modifico el delete para que solo pueda eliminar la clase finalizada el usuario que es dueño de la clase finalizada o el administrador

    async delete(ctx) {
      const user = ctx.state.user;

      // si el usuario que está haciendo la petición no está logueado, no puede eliminar la clase finalizada
      if (!user) {
        return ctx.unauthorized(
          `Inicia sesion para eliminar la clase finalizada`
        );
      }

      // si el usuario que está haciendo la petición no está inscrito en el curso y no es administrador, no puede eliminar la clase finalizada

      const id = ctx.params.id;

      const claseFinalizada = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .findOne({
          where: { id: id },
          populate: { usuario: true, curso: true },

        });

      if (
        user.id != claseFinalizada.usuario.id &&
        user.role.type != "administrador"
      ) {
        return ctx.unauthorized(
          `No tienes permisos para eliminar la clase finalizada`
        );
      }

      // si el usuario que está haciendo la petición está inscrito en el curso o es administrador, puede eliminar la clase finalizada

      //calculo el progreso del curso sin la clase finalizada que se va a eliminar

      const curso = await strapi.db.query("api::curso.curso").findOne({
        where: { id: claseFinalizada.curso.id },
        });


      console.log("este es el curso", curso);

      //obtengo las clases del curso

        const clases = await strapi.db.query("api::clase.clase").findMany({
            where: { curso: claseFinalizada.curso.id },
            });

      console.log("esta es la clase", clases);
      //elimino la clase finalizada

        const claseFinalizadaEliminada = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .delete({
            where: { id: id },
            });

      const clasesFinalizadas = await strapi.db
        .query("api::clases-finalizada.clases-finalizada")
        .findMany({
          where: { usuario: user.id, curso: claseFinalizada.curso.id },
        });

      console.log("esta es la clase", clases.length);
      console.log("esto es clases finalizadas", clasesFinalizadas.length);
      const progreso = ((clasesFinalizadas.length ) * 100) / clases.length;
      console.log("este es el progreso", progreso);
      //actualizo el progreso del curso

      const misCurso = await strapi.db
        .query("api::mis-curso.mis-curso")
        .update({
          where: { usuario: user.id, curso: claseFinalizada.curso.id },
          data: { progress: progreso },
        });
      console.log("Este es el progreso de mis cursos", misCurso.progress);

      //retorno que el curso fue eliminado exitosamente
      
      return claseFinalizadaEliminada;
    },
  })
);

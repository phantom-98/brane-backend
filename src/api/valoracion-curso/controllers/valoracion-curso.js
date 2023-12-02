"use strict";

const { conforms } = require("lodash");

/**
 * valoracion-curso controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::valoracion-curso.valoracion-curso",
  ({ strapi }) => ({
    //modifico el create para que las valoraciones sean creadas solo por usuarios inscritos en el curso y el administrador

    async create(ctx) {
      // obtengo el usuario que está haciendo la petición

      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized(`No tienes permiso, debes estar logueado`);
      }

      const id = ctx.request.body.data.curso;

      const misCursos = await strapi.db
        .query("api::mis-curso.mis-curso")
        .findOne({
          where: { usuario: user.id, curso: id },
        });

      //console.log(misCursos)

      // si usuario es el instructor due;o del curso no puede crear la valoración

      if (user.role.type == "instructor") {
        const curso = await strapi.db.query("api::curso.curso").findOne({
          where: { id: id },
          populate: { instructor: true },
        });
        if (user.id == curso.instructor.id) {
          return ctx.unauthorized(
            `No tienes permisos para crear una valoración en tu propio curso`
          );
        }
      }

      // si el usuario que está haciendo la petición no está inscrito en el curso y no es administrador, no puede crear la valoración

      if (!misCursos && user.role.type != "administrador") {
        return ctx.unauthorized(`No tienes permiso, debes estar inscrito`);
      }
      //si el usuario ya valoró el curso no puede volver a valorarlo

      const valoracion = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findOne({
          where: { usuario: user.id, curso: id },
        });

      if (valoracion) {
        return ctx.unauthorized(`Ya valoraste este curso`);
      }
      
      // inyecto el usuario que está haciendo la petición en el body de la petición

      ctx.request.body.data.usuario = user.id;

      // si el usuario que está haciendo la petición está inscrito en el curso o es administrador, puede crear la valoración

      // actualizo el campo valoracion del curso con la nueva valoración

      const valoraciones = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findMany({
          where: { curso: id },
        });

      let suma = 0;

      for (let i = 0; i < valoraciones.length; i++) {
        suma += valoraciones[i].valoracion;
      }

      suma += ctx.request.body.data.valoracion;

      const promedio = suma / (valoraciones.length + 1);

      await strapi.db.query("api::curso.curso").update({
        where: { id: id },
        data: {
          averageScore: promedio,
        },
      });

      return await super.create(ctx);
    },

    //modifico el update para que solo el usuario que la creó  y el administrador pueda modificarla

    async update(ctx) {
      // obtengo el usuario que está haciendo la petición

      const user = ctx.state.user;

      // si el usuario que está haciendo la petición no está logueado, no puede modificar la valoración

      if (!user) {
        return ctx.unauthorized(`You can't update this entry`);
      }

      // obtengo el id de la valoración que quiero modificar

      const id = ctx.params.id;

      // obtengo la valoración que quiero modificar

      const valoracion = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findOne({
          where: { id: id },
          populate: { usuario: true, curso: true },
        });

      //verifico que la valoracion exista

      if (!valoracion) {
        return ctx.notFound(`No existe la valoración con id ${id}`);
      }

      // si el usuario que está haciendo la petición no es el que creó la valoración y no es administrador, no puede modificar la valoración

      if (
        user.id != valoracion.usuario.id &&
        user.role.type != "administrador"
      ) {
        return ctx.unauthorized(`No tienes permiso `);
      }

      // si el usuario que está haciendo la petición es el que creó la valoración o es administrador, puede modificar la valoración
      //verifico si el usuario modificó la valoración

      if (valoracion.valoracion != ctx.request.body.data.valoracion) {
        //actualizo el campo valoracion del curso con la nueva valoración

        const valoraciones = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findMany({
            where: { curso: valoracion.curso.id },
          });
console.log(valoraciones)
        let suma = 0;

        for (let i = 0; i < valoraciones.length; i++) {

          if (valoraciones[i].id != id) {
          suma += valoraciones[i].valoracion;

          }

        }

        suma += ctx.request.body.data.valoracion;
console.log("esta es la suma",suma)
        const promedio = suma / (valoraciones.length + 1);
console.log("este es el promedio", promedio)
        await strapi.db.query("api::curso.curso").update({
            
          where: { id: valoracion.curso.id },
          data: {
            averageScore: promedio,
          },
        });
      }

      return await super.update(ctx);
    },

    //modifico el delete para que solo el usuario que la creó  y el administrador pueda eliminarla

    async delete(ctx) {
      // obtengo el usuario que está haciendo la petición

      const user = ctx.state.user;

      // si el usuario que está haciendo la petición no está logueado, no puede eliminar la valoración

      if (!user) {
        return ctx.unauthorized(`You can't delete this entry`);
      }

      // obtengo el id de la valoración que quiero eliminar

      const id = ctx.params.id;

      // obtengo la valoración que quiero eliminar

      const valoracion = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findOne({
          where: { id: id},

          populate: { usuario: true, curso: true },
        });

      //verifico que la valoracion exista

      if (!valoracion) {
        return ctx.notFound(`No existe la valoración con id ${id}`);
      }

      // si el usuario que está haciendo la petición no es el que creó la valoración y no es administrador, no puede eliminar la valoración

      if (
        user.id != valoracion.usuario.id &&
        user.role.type != "administrador"
      ) {
        return ctx.unauthorized(`No tienes permiso `);
      }

      // si el usuario que está haciendo la petición es el que creó la valoración o es administrador, puede eliminar la valoración

      
      //actualizo el campo valoracion del curso con la nueva valoración

      const valoraciones = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findMany({
          where: { curso: valoracion.curso.id },
        });

      let suma = 0;

      for (let i = 0; i < valoraciones.length; i++) {
        suma += valoraciones[i].valoracion;
      }
      suma -= valoracion.valoracion;

      const promedio = suma / (valoraciones.length - 1);

      await strapi.db.query("api::curso.curso").update({
        where: { id: valoracion.curso.id },

        data: {
          averageScore: promedio,
        },
      });

      return await super.delete(ctx);
    },
  })
);
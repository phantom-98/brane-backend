"use strict";

/**
 * fa-q controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::fa-q.fa-q", ({ strapi }) => ({
  //modifico el controlador create para que solo el instruuctor del curso o el administrador puedan crear una faq

  async create(ctx) {
    
    const { user } = ctx.state;

    const id = ctx.request.body.data.curso;

    //para crear faq el curso debe ser parametro

    if (!id) {
        return ctx.notFound("Para crear una faq debe enviar el parametro curso");
        }
  
    //observo el curso que se pasa por parametro

    const curso = await strapi.db.query("api::curso.curso", id).findOne({
      where: { id: id },
      populate: { instructor: true },
    });
   
    //si el usuario que hace la petición es el instructor del curso o es administrador puede crear una faq

    if (user.role.type == "instructor" || user.role.type == "administrador") {
      if (user.id == curso.instructor.id || user.role.type == "administrador") {
        ctx.request.body.data.curso = curso.id;
        ctx.request.body.data.usuario = user.id;
        const entity = await strapi.db
          .query("api::fa-q.fa-q")
          .create(ctx.request.body);
        return entity;
      } else {
        return ctx.unauthorized(`No tienes permisos para crear una faq`);
      }
    } else {
      return ctx.unauthorized(`No tienes permisos para crear una faq`);
    }
  },

  //modifico el controlador update para que solo el instruuctor del curso o el administrador puedan actualizar una faq

  async update(ctx) {
    const { user } = ctx.state;

    const id = ctx.params.id;

    //observo el curso del que se quiere actualizar la faq
    console.log("id", id)
    const cursoid = await strapi.db.query("api::fa-q.fa-q").findOne({
      where: { id: id },
      populate: { curso: true },
    });
    //verifico que el curso exista
    if (!cursoid) {
        return ctx.notFound("El curso no existe");
        }

    const curso = await strapi.db
      .query("api::curso.curso", cursoid.curso.id)
      .findOne({
        where: { id: cursoid.curso.id },
        populate: { instructor: true },
      });


    //si el usuario que hace la petición es el instructor del curso o es administrador puede actualizar los datos de faq

    if (user.role.type == "instructor" || user.role.type == "administrador") {
      if (user.id == curso.instructor.id || user.role.type == "administrador") {
        ctx.request.body.data.curso = curso.id;
        ctx.request.body.data.usuario = user.id;
        const entity = await strapi.db
          .query("api::fa-q.fa-q")
          .update({
            where: { id: ctx.params.id },
            data: {
              title: ctx.request.body.data.title,
              description: ctx.request.body.data.description,
            },
          });
        return entity;
      } else {
        return ctx.unauthorized(`No tienes permisos para actualizar una faq`);
      }
    } else {
      return ctx.unauthorized(`No tienes permisos para actualizar una faq`);
    }
  },
  //modifico el controlador delete para que solo el instructor del curso o el administrador puedan eliminar una faq

    async delete(ctx) {
        const { user } = ctx.state;
    
        const id = ctx.params.id;
    
        //observo el curso del que se quiere eliminar la faq

        const cursoid = await strapi.db.query("api::fa-q.fa-q").findOne({
            where: { id: id },
            populate: { curso: true },
        });
    
    //verficar que el curso existe
        if (!cursoid) {
            return ctx.notFound("No existe el curso");
        }

        const curso = await strapi.db
            .query("api::curso.curso", cursoid.curso.id)
            .findOne({
                where: { id: cursoid.curso.id },
                populate: { instructor: true },
            });


        //si el usuario que hace la petición es el instructor del curso o es administrador puede eliminar la faq

        if (user.role.type == "instructor" || user.role.type == "administrador") {
            if (user.id == curso.instructor.id || user.role.type == "administrador") {
                const entity = await strapi.db
                    .query("api::fa-q.fa-q")
                    .delete({where:{id:ctx.params.id}});
                return entity;
            } else {
                return ctx.unauthorized(`No tienes permisos para eliminar una faq`);
            }
        }
        else {
            return ctx.unauthorized(`No tienes permisos para eliminar una faq`);
        }
    },
  
}));

"use strict";

/**
 * wishlist controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::wishlist.wishlist",
  ({ strapi }) => ({
    //modifico el metodo addDelete
    async addDelete(ctx) {
      //obtengo el id del ususario
      const user = ctx.state.user.id;
      console.log("este es el usuario", user);
      //obtengo el id del curso
      const course = ctx.request.body.data.curso;
      console.log("este es el curso", course);

      //busco si el curso que estan enviando en el parametro existe en la wishlist

      const wishlist = await strapi.db
        .query("api::wishlist.wishlist")
        .findOne({ where: { user: user, curso: course } });

      console.log("este es el wishlist", wishlist);

      let message = "";
      //si no existe lo creo
      if (!wishlist) {
        await strapi.db.query("api::wishlist.wishlist").create({
          data: { user: user, curso: course },
        });
        message = "añadido";
      }
      //si existe lo borro
      else {
        await strapi.db.query("api::wishlist.wishlist").delete({
          where: { id: wishlist.id },
        });
        message = "borrado";
      }
      return ctx.send({
        message: message,
      });
    },
    // modifico el metodo find para que solo devuelva los cursos de la wishlist del usuario

    async find(ctx) {
      //obtengo el id del ususario
      const user = ctx.state.user.id;

      //busco los cursos de la wishlist del usuario
      const wishlist = await strapi.db
        .query("api::wishlist.wishlist")
        .findMany({ where: { user: user }, populate: { curso: true } });

      //creo un array con los id de los cursos
      let cursos = [];
      for (let i = 0; i < wishlist.length; i++) {
        cursos.push(wishlist[i].curso.id);
      }

      //busco los cursos con los id del array
      const cursosWishlist = await strapi.db
        .query("api::curso.curso")
        .findMany({ where: { id: cursos } });

      return ctx.send({
        cursosWishlist: cursosWishlist,
      });
    },
  })
);

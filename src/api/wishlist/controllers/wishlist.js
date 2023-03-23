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

      //obtengo la imagen del curso

      const imagenCurso = await strapi.db
        .query("api::curso.curso")
        .findOne({ where: { id: course }, populate: {imagen: true} });
      
      //busco si estan enviando list_wishlist en el body

      let listWishlist = ctx.request.body.data.list_wishlist;
      
      //verifico que la listwishlist sea del usuario logueado

      if (listWishlist) {
        const listWishlistUser = await strapi.db
          .query("api::list-wishlist.list-wishlist")
          .findOne({ where: { id: listWishlist, user: user } });
        if (!listWishlistUser) {
          return ctx.badRequest(null, [
            { messages: [{ id: "La lista no pertenece al usuario" }] },
          ]);
        }
      }
      
      // si no esta envia list_wishlist, reviso si existe la listwishlist por defecto que se llama "wishlist"

      if (!listWishlist) {
        //busco la listwishlist por defecto y si existe le asigno el id a la variable listWishlist
        
        const listWishlistDefault = await strapi.db
          .query("api::list-wishlist.list-wishlist")
          .findOne({ where: { user: user, name: "wishlist" } });

        if (listWishlistDefault) {
          listWishlist = listWishlistDefault.id;
        }
        //si no existe la creo y le asigno el id a la variable listWishlist
        else {
          const newListWishlist = await strapi.db
            .query("api::list-wishlist.list-wishlist")
            .create({
              data: { user: user, name: "wishlist", imagen: imagenCurso.imagen },
            });
            console.log("este es el newListWishlist", newListWishlist);
          listWishlist = newListWishlist.id;
        }
      }
    
      //verifico si la listwishlist posee una imagen, si no tiene le asigno la imagen del curso

      const listWishlistImagen = await strapi.db
        .query("api::list-wishlist.list-wishlist")
        .findOne({ where: { id: listWishlist }, populate: {imagen: true} });

      if (!listWishlistImagen.imagen) {
        await strapi.db.query("api::list-wishlist.list-wishlist").update({
          where: { id: listWishlist },
          data: { imagen: imagenCurso.imagen },
        });
      }

      const wishlist = await strapi.db
        .query("api::wishlist.wishlist")
        .findOne({ where: { user: user, curso: course, list_wishlist: listWishlist}, populate: {list_wishlist:true} });

        //busco si wishlist existe en la wishlist que se esta enviando
    
        
      let message = "";
      //si no existe lo creo
      if (!wishlist) {
        await strapi.db.query("api::wishlist.wishlist").create({
          data: { user: user, curso: course, list_wishlist: listWishlist },
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
        .findMany({ where: { user: user }, populate: true });

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

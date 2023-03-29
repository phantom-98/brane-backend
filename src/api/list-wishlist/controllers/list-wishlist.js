"use strict";

/**
 * list-wishlist controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::list-wishlist.list-wishlist",
  ({ strapi }) => ({
    //modifico findme para que traiga las listwishlist del usuario logueado

    async findMe(ctx) {
      let user = ctx.state.user.id;

      let listwishlist = await strapi.db
        .query("api::list-wishlist.list-wishlist")
        .findMany({ where: { user: user }, populate: {imagen: true} });

      //busco las wishlist de cada listwishlist y contabilizo el numero de wishlist

      for (let i = 0; i < listwishlist.length; i++) {
        let wishlist = await strapi.db
          .query("api::wishlist.wishlist")
          .findMany({ where: { list_wishlist: listwishlist[i].id } });
        listwishlist[i].numWishlist = wishlist.length;
      }

      return ctx.send(listwishlist);
    },

    //modifico el metodo create para que cuando se cree una listwishlist se agregue el usuario que hace la peticion

    async create(ctx) {
      //obtengo el id del usuario
      const user = ctx.state.user.id;

      //obtemgo el nombre de la listwishlist

      const name = ctx.request.body.data.name;

      //obtengo la imagen de la listwishlist

      let imagen = ctx.request.body.data.imagen;

      //si no se envia la imagen, le asigno null

        if (!imagen) {
            imagen = null;
        }

      //si no se envia el nombre de la listwishlist, envio un error

      if (!name) {
        return ctx.badRequest(null, [
          { messages: [{ id: "No se envio el nombre de la nueva lista" }] },
        ]);
      }

      //creo la listwishlist con el nombre y el usuario

      const listwishlist = await strapi.db
        .query("api::list-wishlist.list-wishlist")
        .create({
          data: { user: user, name: name, imagen: imagen },
        });

      return ctx.send(listwishlist);
    },

    //modifico el findOne para mostrar las wishlist de la listwishlist

    async findOne(ctx) {
      //obtengo el id de la listwishlist

      const id = ctx.params.id;

      //obtengo la listwishlist

      let listwishlist = await strapi.db
        .query("api::list-wishlist.list-wishlist")
        .findOne({ where: { id: id }, populate: {imagen: true} });

      //busco las wishlist de la listwishlist

      let wishlist = await strapi.db
        .query("api::wishlist.wishlist")
        .findMany({ where: { list_wishlist: id }, populate: true});

    //creo un array con los id de los cursos de las wishlist

        let cursos = [];

        for (let i = 0; i < wishlist.length; i++) {
            cursos.push(wishlist[i].curso.id);
        }

    //busco los cursos con los id del array

        const cursosWishlist = await strapi.db
        .query("api::curso.curso")
        .findMany({ where: { id: cursos }, populate:true });

        //creo un array de los campos que quiero que se muestren de cada curso: id, name, descripcion, imagen, cantidadEstudiantes, nombre y apellido del instructor y nombre de la categoria

        let arrayEliminar = ["createdAt", "updatedAt", "publishedAt", "precio", "cupon_descuento", "tipo", "certificado","uuid", "averageScore", "createdBy", "updatedBy"];
        
        //recorro el array y elimino los campos de cada curso
        
        for (let i = 0; i < cursosWishlist.length; i++) {
            arrayEliminar.forEach((element) => {
                delete cursosWishlist[i][element];
            })};

        let arrayEliminarInstructor = ["createdAt", "updatedAt", "publishedAt", "email", "password", "resetPasswordToken", "provider", "confirmed", "blocked", "role", "uuid", "createdBy", "updatedBy", "username", "confirmationToken", "averageScore"];

        for (let i = 0; i < cursosWishlist.length; i++) {
            arrayEliminarInstructor.forEach((element) => {
                delete cursosWishlist[i].instructor[element];
            })}
        


    //agrego los cursos a la listwishlist
            
        listwishlist.cursos = cursosWishlist;

      return ctx.send(listwishlist);
    },

    //modifico el metodo update para que solo se pueda modificar por la persona que creo la listwishlist

    async update(ctx) {
        //obtengo el id de la listwishlist
    
        const id = ctx.params.id;
    
        //obtengo el id del usuario
    
        const user = ctx.state.user.id;
    
        //obtengo la listwishlist
    
        const listwishlist = await strapi.db
            .query("api::list-wishlist.list-wishlist")
            .findOne({ where: { id: id }, populate: true });
    
        //si el usuario que hace la peticion no es el mismo que creo la listwishlist y no es administrador, envio un error
    
        if (user != listwishlist.user.id && !ctx.state.user.isAdmin) {
            return ctx.badRequest(null, [
            { messages: [{ id: "No tiene permisos para modificar esta lista" }] },
            ]);
        }
        //
        //actualizo la listwishlist con los datos que se envian

        const listwishlistActualizada = await strapi.db
            .query("api::list-wishlist.list-wishlist")
            .update({ where: { id: id }, data: ctx.request.body.data });

        return ctx.send(listwishlistActualizada);
    },

    //modifico el metodo delete para que solo se pueda eliminar por la persona que creo la listwishlist o el administrador

    async delete(ctx) {

        //obtengo el id de la listwishlist

        const id = ctx.params.id;

        //obtengo el id del usuario

        const user = ctx.state.user.id;

        //obtengo la listwishlist

        const listwishlist = await strapi.db
            .query("api::list-wishlist.list-wishlist")
            .findOne({ where: { id: id }, populate: true });

        //si el usuario que hace la peticion no es el mismo que creo la listwishlist y no es administrador, envio un error

        if (user != listwishlist.user.id && !ctx.state.user.isAdmin) {
            return ctx.badRequest(null, [
            { messages: [{ id: "No tiene permisos para eliminar esta lista" }] },
            ]);
        }

        //elimino la listwishlist

        const listwishlistEliminada = await strapi.db
            .query("api::list-wishlist.list-wishlist")
            .delete({ where: { id: id } });

        return ctx.send(listwishlistEliminada);
    },
        

  })
);

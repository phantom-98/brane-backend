'use strict';

/**
 * cupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cupon.cupon', ({ strapi }) => ({

    //modifico el create para que los cupones sean creados solo por usuario de tipo instructor y administrador

    async create(ctx) {

        // obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        console.log(user.id)

        //	si el usuario que está haciendo la petición no está logueado, no puede crear el cupon

        if (!user) {

            return ctx.unauthorized(`You can't create this entry`);

        }

        // si el usuario que está haciendo la petición no es instructor ni es administrador, no puede crear el cupon

        if (user.role.type != "instructor" && user.role.type != "administrador") {

            return ctx.unauthorized(`No tienes permisos para crear este cupon`);

        }
        //se debe pasar un nombre, valor y tipo para el cupon

        const nombre = ctx.request.body.data.nombre;

        const valor = ctx.request.body.data.valor;

        const tipo = ctx.request.body.data.tipo;

        //si no se envia el nombre del cupon, envio un error

        if (!nombre) {

            return ctx.badRequest("Error", {messages: "No se envio el nombre del cupon"});

        }

        //si no se envia el valor del cupon, envio un error


        if (!valor) {


            return ctx.badRequest("Error", {messages: "No se envio el valor del cupon"});

        }

        //si no se envia el tipo del cupon, envio un error

        if (!tipo) {

            return ctx.badRequest("Error", {messages: "No se envio el tipo del cupon"});

        }

        //asigno el usuario que hace la peticion al campo user del cupon que se quiere crear

        

        console.log("Este es el usuario", ctx.request.body.data);

        // si el usuario que está haciendo la petición es instructor o es administrador se crea el cupon

            const entity = await strapi.db.query('api::cupon.cupon').create({

                data:{...ctx.request.body.data, user: user.id}

            });

            return entity;
    },

    //modifico el update para que los cupones sean actualizados solo por usuario que lo creo y administrador

    async update(ctx) {

        // obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //obtengo el id del cupon que se quiere actualizar

        const id = ctx.params.id;


        //	si el usuario que está haciendo la petición no está logueado, no puede actualizar el cupon

        if (!user) {

            return ctx.unauthorized(`You can't update this entry`);

        }

        // si el usuario que está haciendo la petición no es instructor ni es administrador, no puede actualizar el cupon

        if (user.role.type != "instructor" && user.role.type != "administrador") {

            return ctx.unauthorized(`No tienes permisos para actualizar este cupon`);

        }

        //verifico que el cupon que se quiere actualizar pertenezca al usuario que lo quiere actualizar

        const cupon = await strapi.db

            .query("api::cupon.cupon")

            .findOne({ where: { id }, populate: true });

            console.log("Este es el cupon", cupon);

        //si el usuario que hace la peticion no es el mismo que creo el cupon y no es administrador, envio un error

        if (user.id != cupon.user.id && user.role.type != "administrador") {

            return ctx.badRequest("Error", 

                { messages: "No tienes permisos para actualizar el cupon" },

            );

        }

        // si el usuario que está haciendo la petición es instructor o es administrador, puede actualizar el cupon

        return await super.update(ctx);

    },

    //modifico el delete para que los cupones sean eliminados solo por usuario que lo creo y administrador

    async delete(ctx) {

        // obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //obtengo el id del cupon que se quiere eliminar

        const id = ctx.params.id;

        //	si el usuario que está haciendo la petición no está logueado, no puede eliminar el cupon

        if (!user) {

            return ctx.unauthorized(`You can't delete this entry`);

        }

        // si el usuario que está haciendo la petición no es instructor ni es administrador, no puede eliminar el cupon

        if (user.role.type != "instructor" && user.role.type != "administrador") {

            return ctx.unauthorized(`No tienes permisos para eliminar este cupon`);

        }

        //verifico que el cupon que se quiere eliminar pertenezca al usuario que lo quiere eliminar

        const cupon = await strapi.db

            .query("api::cupon.cupon")

            .findOne({ where: { id }, populate: true });

            console.log("Este es el cupon", cupon);

        //si el usuario que hace la peticion no es el mismo que creo el cupon y no es administrador, envio un error

        if (user.id != cupon.user.id && user.role.type != "administrador") {

            return ctx.badRequest("Error", 

                { messages: "No tienes permisos para eliminar el cupon" },

            );

        }

        // si el usuario que está haciendo la petición es instructor o es administrador, puede eliminar el cupon

        return await super.delete(ctx);
    }
})); 

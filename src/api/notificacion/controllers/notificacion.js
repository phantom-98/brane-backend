'use strict';

/**
 * notificacion controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::notificacion.notificacion',
({ strapi }) => ({

    //controlador find para obtener todas las notificaciones que tiene un usuario

    async find(ctx) {
        //obtengo el id del token 
        const id = ctx.state.user.id;
        console.log(id);
        const notificacion = await strapi.db.query('api::notificacion.notificacion').findMany({ where: { user: id } });
        //si no hay notificaciones para el usuario, se devuelve un mensaje
        if (notificacion.length == 0) {
            return { message: 'No tienes notificaciones' };
        }

        return notificacion;
    },

    //controlador find one para obtener una notificacion en concreto

    async findOne(ctx) {
        //obtengo el id del token
        const id = ctx.state.user.id;
        //obtengo el id de la notificacion
        const idNotificacion = ctx.params.id;
        //busco la notificacion en la base de datos
        const notificacion = await strapi.db.query('api::notificacion.notificacion').findOne({ where: { id: idNotificacion, user: id } });
        //si no existe la notificacion, se devuelve un mensaje
        if (!notificacion) {
            return { message: 'No existe la notificacion en tus notificaciones' };
        }
        return notificacion;
    },

    

}));

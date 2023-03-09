'use strict';

/**
 * clase controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::clase.clase', ({ strapi }) => ({




    //modificamos el update para que solo las clases puedan ser actualizadas por el usuario que lo creó y por el adminisrador

    async update(ctx) {

        //obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //obtengo el id de la clase que se quiere actualizar


        const { id } = ctx.params;

        //si el usuario que está haciendo la petición no está logueado, no puede actualizar la clase

        if (!user) {

            return ctx.unauthorized(`You can't update this entry`);

        }

        //obtengo la clase que se quiere actualizar 

        const clase = await strapi.db.query('api::clase.clase').findOne({

            // uid syntax: 'api::api-name.content-type-name'

            where: { id },

            populate: { curso: true },

        });
        console.log(clase)
        //si la clase no existe, no puede actualizar la clase

        if (!clase) {

            return ctx.unauthorized(`You can't update this entry`);

        }

        //busco el curso al cua pertenece la clase y obtengo el instructor

        const curso = await strapi.db.query('api::curso.curso').findOne({

            // uid syntax: 'api::api-name.content-type-name'

            where: { id: clase.curso.id },

            populate: { instructor: true },

        });
        console.log(curso);


        //si el usuario que está haciendo la petición no es el instructor de la clase ni es administrador, no puede actualizar la clase

        if (user.id != curso.instructor.id && user.role.type != 'administrador') {

            return ctx.unauthorized(`You can't update this entry`);

        }

        //si el usuario que está haciendo la petición es el instructor de la clase o es administrador, puede actualizar la clase

        return await super.update(ctx);


    },

    //modifico el create para que solo usuarios tipo isntructor y administrador puedan crear clases

    async create(ctx) {

        //obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //si el usuario que está haciendo la petición no está logueado, no puede crear la clase

        if (!user) {

            return ctx.unauthorized(`No has iniciado sesión`);

        }
        // verifico que la clase tiene el campo curso lleno, sino doy mensaje de error de validacion de campo curso vacio y no se crea la clase  

        if (!ctx.request.body.data.curso) {

            return ctx.badRequest(null, [

                {
                    messages: [
                        {
                            id: 'Curso is required',
                             message: 'Curso is required',
                        },
                    ],
                },
            ]);
        }
        //obtengo el instructor del curso al que se quiere crear la clase

        const curso = await strapi.db.query('api::curso.curso').findOne({

            // uid syntax: 'api::api-name.content-type-name'

            where: { id: ctx.request.body.data.curso },

            populate: { instructor: true },

        });
        //si el usuario que está haciendo la petición no es el instructor del curso ni es administrador, no puede crear la clase
        console.log("usuario", user.id)
        console.log("instructor", curso.instructor)
        if (user.id != curso.instructor.id && user.role.type != 'administrador') {

            return ctx.unauthorized(`No tienes permisos para crear clases`);

        }

        //si el usuario que está haciendo la petición es instructor o es administrador, puede crear la clase

        return await super.create(ctx);


    },

    //modifico el delete para que solo usuarios tipo isntructor y administrador puedan eliminar clases

    async delete(ctx) {
            
            //obtengo el usuario que está haciendo la petición
    
            const user = ctx.state.user;
    
            //obtengo el id de la clase que se quiere eliminar

            const { id } = ctx.params;

            //si el usuario que está haciendo la petición no está logueado, no puede eliminar la clase

            if (!user) {
                    
                    return ctx.unauthorized(`You can't delete this entry`);
    
                }

            //obtengo la clase que se quiere eliminar

            const clase = await strapi.db.query('api::clase.clase').findOne({

                // uid syntax: 'api::api-name.content-type-name'

                where: { id },

                populate: { curso: true },

            });

            //si la clase no existe, no puede eliminar la clase

            if (!clase) {
                    
                    return ctx.unauthorized(`la clase no existe`);
    
                }

            //busco el curso al cua pertenece la clase y obtengo el instructor

            const curso = await strapi.db.query('api::curso.curso').findOne({

                // uid syntax: 'api::api-name.content-type-name'

                where: { id: clase.curso.id },

                populate: { instructor: true },

            });

            //si el usuario que está haciendo la petición no es el instructor de la clase ni es administrador, no puede eliminar la clase

            if (user.id != curso.instructor.id && user.role.type != 'administrador') {
                        
                        return ctx.unauthorized(`no tiene permisos para eliminar la clase`);
        
                    }

            //si el usuario que está haciendo la petición es el instructor de la clase o es administrador, puede eliminar la clase

            return await super.delete(ctx);


        },

}


));



'use strict';

/**
 * comentario controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comentario.comentario', ({ strapi }) => ({

    //modifico el create para que solo el ususario que tenga el curso en mis cursos pueda comentar la clase
    async create(ctx) {

        //obtengo el usuario que está haciendo la petición
        const user = ctx.state.user;
        console.log(user.id)
        //obtengo el id de la  clase que se quiere comentar

        const  id  = ctx.request.body.data.clase;
       
        //verifico a que curso pertenece la clase

        const clase = await strapi.db.query('api::clase.clase').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { id: id },
            populate: { curso: true },
        });
        
        const curso = await strapi.db.query('api::curso.curso').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { id: clase.curso.id },
        });
        //verifico si el curso al que pertenece la clase existe en la tabla mis cursos

        const misCursos = await strapi.db.query('api::mis-curso.mis-curso').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { curso: curso.id, usuario: user.id },
        });
        
        console.log("esto es mis cursos", misCursos);
        //si el usuario que esta haciendo la peticion no tiene el curso en mis cursos, no puede comentar la clase

        if (!misCursos) {
            return ctx.unauthorized(`No tienes permisos para comentar la clase`);
        }


        //si el usuario que está haciendo la petición no está logueado, no puede comentar la clase
        if (!user) {
            return ctx.unauthorized(`No has iniciado sesión`);
        }

        ctx.request.body.data.autor = user.id;
        ctx.request.body.data.curso = curso.id;
        ctx.request.body.data.fecha_de_publicacion = new Date();
        //si el usuario que está haciendo la petición está inscrito en el curso, puede comentar la clase
        const entity = await strapi.services['api::comentario.comentario'].create(
            
            ctx.request.body
            
        );

        return entity;
    },

    //modifico el update para que solo el ususario autor del comentario pueda modificar el comentario

    async update(ctx) {

        //obtengo el usuario que está haciendo la petición
        const user = ctx.state.user;
        //obtengo el id del comentario que se quiere modificar
        const { id } = ctx.params;
        console.log("este es el id", id)
        //obtengo el comentario que se quiere modificar
        const comentario = await strapi.db.query('api::comentario.comentario').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { id },
            populate: { autor: true },
        });
        //si el usuario que está haciendo la petición no está logueado, no puede modificar el comentario
        if (!user) {
            return ctx.unauthorized(`No has iniciado sesión`);
        }

        //si el usuario que está haciendo la petición no es el autor del comentario, no puede modificar el comentario
        
        if (user.id != comentario.autor.id) {
            return ctx.unauthorized(`No tienes permisos para modificar el comentario`);
        }


        return await super.update(ctx);


    },

    //modifico el find para que solo el ususario que tenga el curso en mis cursos pueda ver los comentarios de la clase pertenecientes a los cursos que tiene en mis cursos

    async find(ctx) {

        //obtengo el usuario que está haciendo la petición
        const user = ctx.state.user;

        //observo los cursos que tiene el usuario en mis cursos

        const misCursos = await strapi.db.query('api::mis-curso.mis-curso').findMany({
            // uid syntax: 'api::api-name.content-type-name'
            where: { usuario: user.id },
            populate: { curso: true },
        });

        //un arreglo con los ids de los cursos que tiene el usuario en mis cursos
        const cursos = misCursos.map((curso) => curso.curso.id);


        //verifico las clases de los cursos que estan en el arreglo cursos

        const clases = await strapi.db.query('api::clase.clase').findMany({
            // uid syntax: 'api::api-name.content-type-name'
            where: { curso: cursos },
        });
        console.log("esto es clases", clases)

        //un arreglo con los ids de las clases que tiene el usuario en mis cursos
        const clasesIds = clases.map((clase) => clase.id);

        //verifico los comentarios de las clases que estan en el arreglo clasesIds

        const comentarios = await strapi.db.query('api::comentario.comentario').findMany({
            // uid syntax: 'api::api-name.content-type-name'
            where: { clase: clasesIds },
            populate: { autor: true, clase: true },
        });
        
        //si el usuario que está haciendo la petición no está logueado, no puede ver los comentarios de las clases
        if (!user) {
            return ctx.unauthorized(`No has iniciado sesión`);
        }

        //si el usuario que está haciendo la petición no tiene cursos en mis cursos, no puede ver los comentarios de las clases
        if (!misCursos) {
            return ctx.unauthorized(`No tienes el curso en mis cursos`);
        }

        //muestrame los comentarios de las clases que tiene el usuario en mis cursos
        return await super.find(ctx);
    },

    //modifico el delete para que solo el ususario autor del comentario pueda eliminar el comentario

    async delete(ctx) {

        //obtengo el usuario que está haciendo la petición
        const user = ctx.state.user;
        //obtengo el id del comentario que se quiere eliminar
        const { id } = ctx.params;
        //obtengo el comentario que se quiere eliminar
        const comentario = await strapi.db.query('api::comentario.comentario').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { id },
            populate: { autor: true },
        });
        if (!comentario) {
            return ctx.unauthorized(`No existe el comentario`);
        }
        //si el usuario que está haciendo la petición no está logueado, no puede eliminar el comentario
        if (!user) {
            return ctx.unauthorized(`No has iniciado sesión`);
        }

        //si el usuario que está haciendo la petición no es el autor del comentario, no puede eliminar el comentario
        if (user.id != comentario.autor.id) {
            return ctx.unauthorized(`No tienes permisos para eliminar el comentario`);
        }
        //si el comentario que se quiere eliminar no existe, no puede eliminar el comentario

        

        return await super.delete(ctx);
    },

    //modifico el findOne para que solo el ususario que tenga el curso en mis cursos pueda ver el comentario de la clase pertenecientes a los cursos que tiene en mis cursos

    async findOne(ctx) {

        //obtengo el usuario que está haciendo la petición
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized(`No has iniciado sesión`);
        }
        //obtengo el id del comentario que se quiere ver

        const { id } = ctx.params;

        //observo la clase del comentario que se quiere ver

        const clase = await strapi.db.query('api::comentario.comentario').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { id },
            populate: { clase: true },
        });

        //observo el curso de la clase del comentario que se quiere ver

        const curso = await strapi.db.query('api::clase.clase').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { id: clase.clase.id },
            populate: { curso: true },

        });

        //verfico si el curso de la clase del comentario que se quiere ver está en mis cursos

        const misCursos = await strapi.db.query('api::mis-curso.mis-curso').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { usuario: user.id, curso: curso.curso.id },
            populate: { curso: true },
        });

        console.log("esto es misCursos", misCursos)
        
        //si el usuario que está haciendo la petición no tiene el curso en mis cursos, no puede ver el comentario de la clase
        if (!misCursos) {
            return ctx.unauthorized(`No tienes el curso en mis cursos`);
        }
    

        //muestra el comentario de la clase que tiene el usuario en mis cursos
        return await super.findOne(ctx);

    },

}));

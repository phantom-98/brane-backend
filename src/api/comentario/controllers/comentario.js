'use strict';
// import lodash from 'lodash';

const _ = require('lodash');
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
        // leo el tipo de comentario si es "comentario" o "mensaje"

        const tipo = ctx.request.body.data.tipo;

        if(tipo == "mensaje"){


            //si el usuario que está haciendo la petición no está logueado, no puede comentar la clase
            if (!user) {
                return ctx.unauthorized(`No has iniciado sesión`);
            }

            // veo el tipo de rol quien manda el mensaje


            if(user.role.type == "instructor"){


                // quien manda es un instructor, verifico que el destinatario sea un estudiante de sus cursos

                const  destinatario  = ctx.request.body.data.destinatario;

                //verifico los "mis cursos" del destinatario donde el instructor sea el que manda el mensaje o los mis cursos del usuario que manda el mensaje donde el instructor sea el destinatario


                const misCursos = await strapi.db.query('api::mis-curso.mis-curso').findOne({
                    where: {
                      $or: [
                        { usuario: user.id, instructor: destinatario },
                        { usuario: destinatario, instructor: user.id }
                      ]
                    }
                  });







                console.log("esto es mis cursos", misCursos);


                


                if (!misCursos) {


                    return ctx.badRequest("El destinatario no es un estudiante de sus cursos");

                }

                ctx.request.body.data.autor = user.id;
                ctx.request.body.data.fecha_de_publicacion = new Date();
                //si el usuario que está haciendo la petición está inscrito en el curso, puede comentar la clase
                const entity = await strapi.services['api::comentario.comentario'].create(
                    
                    ctx.request.body
                    
                );
        
                return entity;



            }else if (user.role.type == "authenticated") {


                // verifico si el profesor a quien le mando el mensaje es instructor de alguno de mis cursos
                const  destinatario  = ctx.request.body.data.destinatario;

                console.log("este es el emisor", user)

                console.log("este es el destinatario", destinatario)

                //verifico los "mis cursos" del destinatario donde el instructor sea el que manda el mensaje


                const misCursos = await strapi.db.query('api::mis-curso.mis-curso').findOne({

                    where: { instructor: destinatario, usuario: user.id },

                });




                console.log("esto es mis cursos", misCursos);


                // si si se encuentra el curso, se puede enviar el mensaje


                if (!misCursos) {


                    return ctx.unauthorized(`No puedes contactar a este usuario porque no es tu instructor.`);

                }

                ctx.request.body.data.autor = user.id;
                ctx.request.body.data.fecha_de_publicacion = new Date();
                //si el usuario que está haciendo la petición está inscrito en el curso, puede comentar la clase
                const entity = await strapi.services['api::comentario.comentario'].create(
                    
                    ctx.request.body
                    
                );
        
                return entity;



                
            }else{
                    
                    return ctx.unauthorized(`No tienes permisos para enviar mensajes`);
            }

        



    


        }else{

        

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
            populate: { instructor: true },
        });
        //verifico si el curso al que pertenece la clase existe en la tabla mis cursos
        

        let misCursos = await strapi.db.query('api::mis-curso.mis-curso').findOne({
            // uid syntax: 'api::api-name.content-type-name'
            where: { curso: curso.id, usuario: user.id },
        });
        
        
        //si el usuario que esta haciendo la peticion no tiene el curso en mis cursos, no puede comentar la clase
        if (!misCursos && user.role.type == "authenticated") {
            // verifico si el usuario es un instructor del curso

            if (!misCursos) {
                return ctx.unauthorized(`No tienes permisos para comentar la clase`);
            }

        }if (user.role.type == "instructor") {

            
            // verifico si el usuario es un instructor del curso

            if (curso.instructor.id != user.id) {
                return ctx.unauthorized(`No tienes permisos para comentar la clase`);
            }


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

        }
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

    async messageMe(ctx) {


        //obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //si el usuario que está haciendo la petición no está logueado, no puede enviar mensajes

        if (!user) {

            return ctx.unauthorized(`No has iniciado sesión`);

        }

        
        //busco todos los comentarios de tipo mensaje que tiene como author el usuario que está haciendo la petición, lo agrupo por remite y los ordeno por fecha de creación, y los ordeno de forma descendente para que los más recientes aparezcan primero y muestra el ultimo mensaje que se envió


        let mensajes = await strapi.db.query('api::comentario.comentario').findMany({

            // uid syntax: 'api::api-name.content-type-name'

            where: {$or: [{ autor: user.id, tipo: "mensaje" }, { destinatario: user.id, tipo: "mensaje" }]}   ,

            populate: { destinatario: true , autor: true},



        });



        console.log("esto es mensajes", mensajes)


        /*
            Los recorro par obtener la forma


                destinatario: [

                    id: 1,
                    nombre: "juan",
                    messages: [

                        {

                            id: 1,

                            mensaje: "hola"

                        },

                    ]

                    lastMessage: {

                        id: 1,

                        mensaje: "hola"

                    }

                ]





        */


        let mensajesFormateados = [];

        for (let i = 0; i < mensajes.length; i++) {
            let destinatario ="";
            if(mensajes[i].autor.id == user.id) {

                mensajes[i].destinatario = mensajes[i].destinatario;
                destinatario = mensajes[i].destinatario;

            }else{

                destinatario = mensajes[i].autor;
            }

           // let destinatario = mensajes[i].destinatario;

            let mensaje = mensajes[i];



            //busco el destinatario para tener el avatar

            

            let destinatarioIndex = mensajesFormateados.findIndex((destinatario) => destinatario.id == mensaje.destinatario.id);

            if (destinatarioIndex == -1) {

                mensajesFormateados.push({

                    id: destinatario.id,

                    nombre: destinatario.nombre + " " + destinatario.apellidos,
                    // mando los mensjaes con los campos que necesito "id, comentario, fecha_de_publicacion"

                  /*  mensajes: [{
                        id: mensaje.id,
                        comentario: mensaje.comentario,
                        fecha_de_publicacion: mensaje.fecha_de_publicacion
                    }],*/
                    
                    

                    ultimoMensaje: {
                        id: mensaje.id,
                        comentario: mensaje.comentario,
                        fecha_de_publicacion: mensaje.fecha_de_publicacion
                    },

                   

                });

            } else {

             /*   mensajesFormateados[destinatarioIndex].mensajes.push({
                    id: mensaje.id,
                    comentario: mensaje.comentario,
                    fecha_de_publicacion: mensaje.fecha_de_publicacion
                });*/

                mensajesFormateados[destinatarioIndex].ultimoMensaje = {
                    id: mensaje.id,
                    comentario: mensaje.comentario,
                    fecha_de_publicacion: mensaje.fecha_de_publicacion
                };

            }

        }

        //ordeno los mensajes por fecha de creación de forma descendente para que los más recientes aparezcan primero

        mensajesFormateados.sort((a, b) => {

            return new Date(b.ultimoMensaje.fecha_de_publicacion) - new Date(a.ultimoMensaje.fecha_de_publicacion);

        });

        // recorro para adicionar el avatar

        for (let i = 0; i < mensajesFormateados.length; i++) {

            let destinatario = mensajesFormateados[i];

            let avatar = await strapi.db.query('plugin::users-permissions.user').findOne({

                // uid syntax: 'api::api-name.content-type-name'

                where: { id: destinatario.id },
                populate: { avatar: true },

            });

            if(avatar.avatar){

                console.log(avatar.avatar)
                destinatario.avatar = avatar.avatar.url;

                // coloco un condicional que si avatar.avatar.formats y  que avatar.avatar.formats.thumbnail existe, entonces se lo asigno a destinatario.avatar, sino se lo asigno a destinatario.avatar

                if(avatar.avatar.formats ){
                    
                    if( avatar.avatar.formats.thumbnail){

                        destinatario.avatar = avatar.avatar.formats.thumbnail.url;
                    }
                    

                }



            }else{

                destinatario.avatar = false;

            }

        }




        return mensajesFormateados;



        

    },

    async messageMeForId(ctx) {


        //obtengo el usuario que está haciendo la petición

        const user = ctx.state.user;

        //si el usuario que está haciendo la petición no está logueado, no puede enviar mensajes

        if (!user) {

            return ctx.unauthorized(`No has iniciado sesión`);

        }

        //obtengo el id del usuario que quiero ver sus mensajes

        const { id } = ctx.params;

        //busco todos los comentarios de tipo mensaje que tiene como author o destinatario el usuario que está haciendo la petición, y los ordeno por fecha de creación, y los ordeno de forma descendente para que los más recientes aparezcan primero


        let mensajesMios = await strapi.db.query('api::comentario.comentario').findMany({

            // uid syntax: 'api::api-name.content-type-name'

            where: { autor: user.id, tipo: "mensaje", destinatario: id },



            populate: { destinatario: true, autor: true },

            sort: 'fecha_de_publicacion:desc'

        });


        let mensajesDelDestinatario = await strapi.db.query('api::comentario.comentario').findMany({

            // uid syntax: 'api::api-name.content-type-name'

            where: { autor: id, tipo: "mensaje", destinatario: user.id },

            populate: { destinatario: true, autor: true },

            sort: 'fecha_de_publicacion:desc'

        });


        let mensajes = mensajesMios.concat(mensajesDelDestinatario);

        mensajes.sort((a, b) => {

            return new Date(b.fecha_de_publicacion) - new Date(a.fecha_de_publicacion);

        });



        // ubico los avatares de los usuarios donde avatarActual es el avatar del usuario que está haciendo la petición y avatarRequest es el avatar del usuario que quiero ver sus mensajes


        let avatarActualP = strapi.db.query('plugin::users-permissions.user').findOne({

            // uid syntax: 'api::api-name.content-type-name'

            where: { id: user.id },

            populate: { avatar: true },

        });


        let avatarRequestP = strapi.db.query('plugin::users-permissions.user').findOne({

            // uid syntax: 'api::api-name.content-type-name'

            where: { id: id },

            populate: { avatar: true },

        });

        // ejecuto un Promise.all para que se ejecuten las dos consultas al mismo tiempo


        let [avatarActual, avatarRequest] = await Promise.all([avatarActualP, avatarRequestP]);


        // recorro los mensajes para adicionar el avatar del usuario que está haciendo la petición y el avatar del usuario que quiero ver sus mensajes y el nombre del usuario que está haciendo la petición y el nombre del usuario que quiero ver sus mensajes


        for (let i = 0; i < mensajes.length; i++) {

            let mensaje = mensajes[i];

            delete mensaje.autor.avatar;

            mensaje.remitente = {
                avatar: false,
                nombre: "",
                id: mensaje.autor.id
            };


            if (mensaje.autor.id == user.id) {
                

                mensaje.remitente.avatar = avatarActual.avatar ? avatarActual.avatar.url : false;

                if(mensaje.remitente.avatar  ){

                    if (mensaje.remitente.avatar.formats ){

                        if( mensaje.remitente.avatar.formats.thumbnail){

                            mensaje.remitente.avatar = mensaje.remitente.avatar.formats.thumbnail.url;

                        }

                    }

                }



                mensaje.remitente.nombre = avatarActual.nombre + " " + avatarActual.apellidos;

            } else {

                mensaje.remitente.avatar = avatarRequest.avatar ? avatarRequest.avatar.url : false;

                if( mensaje.remitente.avatar){

                    if (mensaje.remitente.avatar.formats ){

                        if( mensaje.remitente.avatar.formats.thumbnail){

                            mensaje.remitente.avatar = mensaje.remitente.avatar.formats.thumbnail.url;

                        }

                    }



                }

                mensaje.remitente.nombre = avatarRequest.nombre + " " + avatarRequest.apellidos;

            }

            // elimino le campo destinatario ya que no lo necesito

            delete mensaje.destinatario;

            delete mensaje.autor;

            delete mensaje.tipo;

            delete mensaje.createdAt;

            delete mensaje.updatedAt;

            delete mensaje.uuid;


        }





        return mensajes;





    }

    

}));

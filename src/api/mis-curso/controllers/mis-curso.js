"use strict";

/**
 * mis-curso controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::mis-curso.mis-curso",
  ({ strapi }) => ({
    //modifico el metodo find para que me traiga los cursos que estan en el usuario logueado
    async find(ctx) {
      const user = ctx.state.user;

      // si no hay usuario

      if (!user) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "No autorizado",
                message: "No autorizado",
              },
            ],
          },
        ]);
      }

      // si hay usuario, le agrego el filtro de usuario

      ctx.query.filters = {
        ...(ctx.query.filters || {}),
        usuario: user.id,
      };
      
      return super.find(ctx);
    },
    //modifico el metodo create para que cuando se cree mis curso se agregue el campo progress con valor 0
    async create(ctx) {
      const user = ctx.state.user;

      // si no hay usuario

      if (!user) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: "No autorizado",
                message: "No autorizado",
              },
            ],
          },
        ]);
      }

      // si hay usuario, le agrego el filtro de usuario

      ctx.request.body.data.usuario = user.id;
      ctx.request.body.data.progress = 0;

      //obtengo el curso que se quiere agregar

      const curso = await strapi.db.query("api::curso.curso").findOne({
        where: { id: ctx.request.body.data.curso },
      });

      //actualizo el numero de usuarios que tiene el curso


      await strapi.db.query("api::curso.curso").update({
        where: { id: curso.id },
        data: { cantidadEstudiantes: curso.cantidadEstudiantes + 1 },
      });

      return super.create(ctx);
    },
    async findCursoByUser(ctx) {
      ctx.query = { ...ctx.query, local: "en" };



      const slug = ctx.params.slug;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { slug: slug },
        select: ["id"],
        
      
    })

    

    if(!user) return ctx.notFound('No se encontró el usuario');

    // si hay busco todos los cursos que tiene el usuario


      ctx.query.filters = {
        ...(ctx.query.filters || {}),
        
        usuario: user.id,
      };

      // añado el parametro populate=curso para que me traiga el curso

      ctx.query.populate = "curso";



      

    const { data, meta } = await super.find(ctx);



    if(!data) return ctx.notFound('No se encontraron cursos');


    // recorro los cursos y anexo el instructor

    for (let i = 0; i < data.length; i++) {

      let curso = data[i];



      curso= await strapi.db.query("api::curso.curso").findOne({ where: { id: curso.attributes.curso.data.id }, populate: true });





      let instructor = await strapi.db.query("plugin::users-permissions.user").findOne({
        // uid syntax: 'api::api-name.content-type-name'
        where: {
          id: curso.instructor.id,
        },
        //selecciono solo el instructor
        populate: true,
      });


      let arrayEliminar = [
        "password",
        "provider",
        "resetPasswordToken",
        "confirmationToken",
        "confirmed",
        "blocked",
        "username",
        "createdBy",
        "updatedBy",
        "publishedAt",
      ]
      arrayEliminar.forEach((element) => {
        delete instructor[element];
      }
      );

      // borro curso de data[i]
      if(data[i].attributes.curso){
        delete data[i].attributes.curso;
      }

      if(curso){
        delete curso.instructor;
      }

      if(curso.createdBy){

        delete curso.createdBy;

      }

      if(curso.updatedBy){

        delete curso.updatedBy;

      }

   
      data[i] = { ...data[i], curso:curso , instructor: instructor };

    }





      meta.date = Date.now();


    return { data, meta };





      const entity = await strapi.db.query("api::mis-curso.mis-curso").findMany({
        where: { slug: slug },
        populate: true
      });
  
      // recorro los cursos y anexo el instructor
  
  /*    for (let i = 0; i < data.length; i++) {
        const curso = data[i];
        console.log(curso.attributes.instructor)
        curso.attributes.instructor = await strapi.db.query("plugin::users-permissions.user").findOne({
          // uid syntax: 'api::api-name.content-type-name'
          where: {
            id: curso.attributes.instructor.data.id,
          },
          //selecciono solo el instructor
          populate: true,
        });
  
        let arrayEliminar = [
          "password",
          "provider",
          "resetPasswordToken",
          "confirmationToken",
          "confirmed",
          "blocked",
          "username",
          "createdAt",
          "updatedAt",
          "publishedAt",
        ]
        arrayEliminar.forEach((element) => {
          delete curso.attributes.instructor[element];
        }
        );
  
      }*/
  
      // some more custom logic
      meta.date = Date.now();
  
      return { data, meta };
    },
  })
);

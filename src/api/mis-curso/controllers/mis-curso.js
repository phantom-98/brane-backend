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

      //recorro las valoraciones que tiene el usuario y si tiene valoraciones las agrego en la respuesta

      let data = await super.find(ctx);



      for (let i = 0; i < data.data.length; i++) {

        console.log("usuario", user.id)
        let valoracion = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findOne({
            where: { usuario: user.id, curso: data.data[i].attributes.curso.data.id },
          });

        if (valoracion) {
          data.data[i].attributes.valoracion = valoracion.valoracion;
        }
      }


      return data;
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

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { slug: slug },
          select: ["id"],
        });

      if (!user) return ctx.notFound("No se encontró el usuario");

      // si hay busco todos los cursos que tiene el usuario

      ctx.query.filters = {
        ...(ctx.query.filters || {}),

        usuario: user.id,
      };

      // añado el parametro populate=curso para que me traiga el curso

      ctx.query.populate = "curso";

      const { data, meta } = await super.find(ctx);

      if (!data) return ctx.notFound("No se encontraron cursos");

      // recorro los cursos y anexo el instructor

      for (let i = 0; i < data.length; i++) {
        let curso = data[i];

        curso = await strapi.db
          .query("api::curso.curso")
          .findOne({
            where: { id: curso.attributes.curso.data.id },
            populate: true,
          });

        let instructor = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
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
        ];
        arrayEliminar.forEach((element) => {
          delete instructor[element];
        });

        // borro curso de data[i]
        if (data[i].attributes.curso) {
          delete data[i].attributes.curso;
        }

        if (curso) {
          delete curso.instructor;
        }

        if (curso.createdBy) {
          delete curso.createdBy;
        }

        if (curso.updatedBy) {
          delete curso.updatedBy;
        }

        data[i] = { ...data[i], curso: curso, instructor: instructor };
      }

      //recorro las valoraciones que tiene el usuario por curso y si tiene valoraciones las agrego en la respuesta

      meta.date = Date.now();

      return { data, meta };

    },
    async findMyProfesores(ctx) {


      // recibo el usuario logueado

      const user = ctx.state.user;

      // verifico que sea usuario y tenga role instructor

      if (!user) {
        //ctx.response.status	= 401;
        return ctx.response.unauthorized([

          {
            id: "No autorizado",

            message: "No autorizado",
          },

        ]);
      }



      // busco mis cursos populando el campo instructor

      const cursos = await strapi.db.query("api::mis-curso.mis-curso").findMany({ where: { usuario: user.id }, populate: ['instructor', 'instructor.avatar'] });


      // recorro cursos y creo un array  que tenga profesores unicos con los sigueintes campos id, nombre, apellido, slug, avatar

      let profesores = [];

      // uso for para poder usar async await

      for (let i = 0; i < cursos.length; i++) {

        let profesor = cursos[i].instructor;

        //let profesor = curso.instructor;

        let existe = profesores.find((profe) => profe.id === profesor.id);

        if (!existe) {



          if (profesor.avatar) {

            if (profesor.avatar.formats) {

              if (profesor.avatar.formats.thumbnail) {

                profesor.avatar = profesor.avatar.formats.thumbnail.url;

              }

            }

          } else {
            profesor.avatar = false;
          }


          profesores.push({ id: profesor.id, nombre: profesor.nombre + " " + profesor.apellidos, slug: profesor.slug, avatar: profesor.avatar });

        }
      }

      return ctx.send({ data: profesores });




    },

    async addUserToCourse(ctx) {


      // verifico que el usuario este logueado

      const empresa = ctx.state.user;

      if (!empresa) {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No esta logueado",
          },

        );
      }

      
      //verifico sea tipo empresa

      if (empresa.role.type !== "empresa") {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No es una empresa",
          },

        );
      }



      // recibo los datos del body

      const { curso, usuario } = ctx.request.body;


      
      if (!curso || !usuario) {

        return ctx.response.badRequest("Faltan datos", {"message": "Alguno de los datos no se ha recibido"});
      }


      const userEmpresa = await strapi.db.query("plugin::users-permissions.user").findOne({ where: { id: usuario, company: empresa.id } });


      if (!userEmpresa) {

        return ctx.response.badRequest("No autorizado", {"message": "No autorizado, el usuario no pertenece a la empresa"});
      }


      // verifico que el curso haya sido comprado por la empresa, es decir esté en la tabla mis-cursos


      const cursoEmpresa = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: empresa.id }, populate: ['instructor'] });


      if (!cursoEmpresa) {

        return ctx.response.unauthorized("No autorizado", {"message": "El curso no ha sido comprado por la empresa"});
      }


      // verifico que el usuario no este ya en el curso


      const usuarioCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: usuario } });


      if (usuarioCurso) {

        return ctx.response.badRequest("Ya esta en el curso", {"message": "El usuario ya esta en el curso"});



        
      }


      // creo el registro en la tabla mis-cursos


      const registro = await strapi.db.query("api::mis-curso.mis-curso").create(
        {data:{
           curso: curso, usuario: usuario, buying_company: empresa.id, course_company:true, instructor : cursoEmpresa.instructor.id 
        }}
      );




      return registro;







    },
    async deleteUserToCourse(ctx) {


      // verifico que el usuario este logueado

      const empresa = ctx.state.user;

      if (!empresa) {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No esta logueado",
          },

        );
      }

      
      //verifico sea tipo empresa

      if (empresa.role.type !== "empresa") {

        return ctx.response.unauthorized("No autorizado",

          {
            id: "No autorizado",

            message: "No autorizado - No es una empresa",
          },

        );
      }



      // recibo los datos del body

      const { curso, usuario } = ctx.request.body;


      
      if (!curso || !usuario) {

        return ctx.response.badRequest("Faltan datos", {"message": "Alguno de los datos no se ha recibido"});
      }


      const userEmpresa = await strapi.db.query("plugin::users-permissions.user").findOne({ where: { id: usuario, company: empresa.id } });


      if (!userEmpresa) {

        return ctx.response.badRequest("No autorizado", {"message": "No autorizado, el usuario no pertenece a la empresa"});
      }


      // verifico que el curso haya sido comprado por la empresa, es decir esté en la tabla mis-cursos


      const cursoEmpresa = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: empresa.id }, populate: ['instructor'] });


      if (!cursoEmpresa) {

        return ctx.response.unauthorized("No autorizado", {"message": "El curso no ha sido comprado por la empresa"});
      }


      // verifico que el usuario no este ya en el curso


      const usuarioCurso = await strapi.db.query("api::mis-curso.mis-curso").findOne({ where: { curso: curso, usuario: usuario } });


      if (!usuarioCurso) {

        return ctx.response.badRequest("El usuario no está en el curso", {"message": "El usuario no está en el curso"});



        
      }


      // elimino el registro en la tabla mis-cursos


      const registro = await strapi.db.query("api::mis-curso.mis-curso").delete(

        {where: {curso: curso, usuario: usuario}}

      );


      // busco todas las clases finalizadas del usuario en el curso 


      const clasesFinalizadas = await strapi.db.query("api::clases-finalizada.clases-finalizada").find({ where: { curso: curso, usuario: usuario } });


      // elimino todas las clases finalizadas del usuario en el curso

      if (clasesFinalizadas.length > 0) {

        // recorro con for  porque no me funciona con forEach y las elimino

        for (let i = 0; i < clasesFinalizadas.length; i++) {

          const clase = clasesFinalizadas[i];

          await strapi.db.query("api::clases-finalizada.clases-finalizada").delete(

            {where: {id: clase.id}}

          );

        }
      }



      return registro;







    }

  })
);

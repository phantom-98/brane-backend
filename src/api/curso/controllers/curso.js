"use strict";

/**
 * curso controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

//module.exports = createCoreController('api::curso.curso');

module.exports = createCoreController("api::curso.curso", ({ strapi }) => ({
  // Method 2: Wrapping a core action (leaves core logic in place)
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: "en" };

    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // recorro los cursos y anexo el instructor

    for (let i = 0; i < data.length; i++) {
      const curso = data[i];
      console.log(curso.attributes.instructor);
      curso.attributes.instructor = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
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
      ];
      arrayEliminar.forEach((element) => {
        delete curso.attributes.instructor[element];
      });
    }

    // some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },

  // modifico el update para que solo los cursos puedan ser actualizados por el usuario que lo creó y por el adminisrador

  async update(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    // obtengo el id del curso que se quiere actualizar

    console.log(user);

    const { id } = ctx.params;

    //	si el usuario que está haciendo la petición no está logueado, no puede actualizar el curso

    if (!user) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    //	obtengo el curso que se quiere actualizarº

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true },
    });

    // si el curso no existe, no puede actualizar el curso

    if (!curso) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    // verifico que el curso tiene instructor

    // si el usuario que está haciendo la petición no es el instructor del curso ni es administrador, no puede actualizar el curso

    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`You can't update this entry`);
    }
    const { subTitles, whatYouWillLearn, requirements, whoIsThisCourseFor } =
      ctx.request.body.data;


    if (subTitles) {
      ctx.request.body.data.subTitles = JSON.stringify(subTitles);
    }

    if (whatYouWillLearn) {
      ctx.request.body.data.whatYouWillLearn = JSON.stringify(whatYouWillLearn);
    }

    if (requirements) {
      ctx.request.body.data.requirements = JSON.stringify(requirements);
    }

    if (whoIsThisCourseFor) {
      ctx.request.body.data.whoIsThisCourseFor =
        JSON.stringify(whoIsThisCourseFor);
    }






    



    let data = [];

    const { cupon_descuento } = ctx.request.body.data;

    if(cupon_descuento){


      const cupon = await strapi.db
      .query("api::cupon.cupon")
      .findOne({ where: { slug: cupon_descuento }, populate: true });

    
    // si el cupom_descuento no existe en la tabla cupon no se puede asignar el cupom_descuento al curso

    if (!cupon) {
      return ctx.badRequest("El cupom no existe",         {
        messages: [
          {
            id: "Curso.validation.cupom_descuento.required",
            message: "El cupom no existe",
          },
        ],
      },);
    }

    data = await super.update(ctx);

    let cursos_cupon = [  id , ...cupon.cursos.map((curso) => curso.id)]



    await strapi.db
      .query("api::cupon.cupon")
      .update(
        { where: { slug: cupon_descuento },
        data: { cursos:  cursos_cupon } }
      );

      
    }else{


      data = await super.update(ctx);

    }

        
    return data;

  },

  // modifico el delete para que solo los cursos puedan ser eliminados por el usuario que lo creó y por el adminisrador

  async delete(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    // obtengo el id del curso que se quiere eliminar

    const { id } = ctx.params;

    //	si el usuario que está haciendo la petición no está logueado, no puede eliminar el curso

    if (!user) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    //	obtengo el curso que se quiere eliminar

    const curso = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true },
    });

    // si el curso no existe, no puede eliminar el curso

    if (!curso) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    // verifico que el curso tiene instructor

    // si el usuario que está haciendo la petición no es el instructor del curso ni es administrador, no puede eliminar el curso

    if (user.id != curso.instructor.id && user.role.type != "administrador") {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    // si el usuario que está haciendo la petición es el instructor del curso o es administrador, puede eliminar el curso

    return await super.delete(ctx);
  },

  //	modifico el create para que solo los cursos puedan ser creados por usuariostipo instructor y por el adminisrador

  async create(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //	si el usuario que está haciendo la petición no está logueado, no puede crear el curso

    if (!user) {
      return ctx.unauthorized(`You can't create this entry`);
    }

    // si el usuario que está haciendo la petición no es instructor ni es administrador, no puede crear el curso

    if (user.role.type != "instructor" && user.role.type != "administrador") {
      return ctx.unauthorized(`You can't create this entry`);
    }

    // si el usuario que esta haciendo la peticion es de tipo instructor le asigno el instructor al curso

    if (user.role.type == "instructor") {
      ctx.request.body.data.instructor = user.id;
    }
    console.log(ctx.request.body.data.instructor);
    // si el usuario que esta haciendo la peticion es de tipo administrador y no envia el instructor, no puede crear el curso

    if (!ctx.request.body.data.instructor && user.role.type != "instructor") {
      return ctx.badRequest(null, [
        {
          messages: [
            {
              id: "Curso.validation.instructor.required",
              message: "El campo instructor es requerido",
            },
          ],
        },
      ]);
    }


    // si el cupom_descuento existe en la tabla cupon verifico el instructor del cupon

    // si el instructor del cupon es diferente al instructor del curso no se puede asignar el cupom_descuento al curso

    if (cupon.user.id != ctx.request.body.data.instructor) {
      return ctx.badRequest(null, [
        {
          messages: [
            {
              id: "Curso.validation.cupom_descuento.required",
              message: "El cupom no pertenece al instructor",
            },
          ],
        },
      ]);
    }

    // si el cupom_descuento existe en la tabla cupon y el instructor del cupon es igual al instructor del curso se puede asignar el cupom_descuento al curso y en la tabla cupon se actualiza el campo curso con el id del curso creado

    

    // extraigo los campos subTitles , whatYouWillLearn y requirements

    const { subTitles, whatYouWillLearn, requirements, whoIsThisCourseFor } =
      ctx.request.body.data;

    console.log("SUBTITULOS", whatYouWillLearn);

    // son de tipo array, los serializo para poder guardarlos en la base de datos

    // si subtittles no está definido, no lo serializo

    if (subTitles) {
      // verifico sea un array  sino retorno un error

      if (!Array.isArray(subTitles)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo subtitulos debe ser un array",
        });
      }

      if (subTitles.length) {
        ctx.request.body.data.subTitles = JSON.stringify(subTitles);
      }
    }

    if (whatYouWillLearn) {
      if (!Array.isArray(whatYouWillLearn)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo que aprenderas debe ser un array",
        });
      }

      if (whatYouWillLearn.length) {
        ctx.request.body.data.whatYouWillLearn =
          JSON.stringify(whatYouWillLearn);
      }
    }

    if (requirements) {
      if (!Array.isArray(requirements)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo requerimientos debe ser un array",
        });
      }

      if (requirements.length) {
        ctx.request.body.data.requirements = JSON.stringify(requirements);
      }
    }

    if (whoIsThisCourseFor) {
      ctx.request.body.data.whoIsThisCourseFor =
        JSON.stringify(whoIsThisCourseFor);
    }

    // si el usuario que está haciendo la petición es administrador, puede crear el curso

    /* if (!ctx.request.body.instructor) {
      if (user.role.type == 'instructor') {
        ctx.request.body.instructor = user.id;
      } else {
        return ctx.unauthorized(`You can't create this entry`);
      }
    }*/



    

    
    let data = [];

    const { cupon_descuento } = ctx.request.body.data;

    if(cupon_descuento){


      const cupon = await strapi.db
      .query("api::cupon.cupon")
      .findOne({ where: { slug: cupon_descuento }, populate: true });

    
    // si el cupom_descuento no existe en la tabla cupon no se puede asignar el cupom_descuento al curso

    if (!cupon) {
      return ctx.badRequest("El cupom no existe",         {
        messages: [
          {
            id: "Curso.validation.cupom_descuento.required",
            message: "El cupom no existe",
          },
        ],
      },);
    }

    data = await super.create(ctx);

    let cursos_cupon = [  data.data.id , ...cupon.cursos.map((curso) => curso.id)]



    await strapi.db
      .query("api::cupon.cupon")
      .update(
        { where: { slug: cupon_descuento },
        data: { cursos:  cursos_cupon } }
      );

      
    }else{


      data = await super.create(ctx);

    }

        
    return data;
  },

  // modifico el findone para que solo los cursos puedan ser consultados por todos

  async findOne(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    // obtengo el id del curso que se quiere consultar

    const { id } = ctx.params;

    // consulto si el curso que se quiere consultar existe traigo solo id y titulo

    const curso_id = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      select: ["id"],
    });

    // si el curso no existe, retorno error 404 not found

    if (!curso_id) {
      return ctx.notFound();
    }

    let data = {};

    // verifico si el usuario esta logueado o no

    if (user) {
      if (user.role.type != "administrador" && user.role.type != "instructor") {
        // verifico en la tabla mis cursos si el usuario que está haciendo la petición tiene el curso que se quiere consultar

        const misCursos = await strapi.db
          .query("api::mis-curso.mis-curso")
          .findOne({ where: { curso: id, usuario: user.id } });

        // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

        if (!misCursos) {
          // obtengo el curso que se quiere consultar

          const curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: { instructor: true } });

          // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

          const clases = await strapi.db.query("api::clase.clase").findMany({
            where: { curso: id },
            select: ["nombre", "duracion", "descripcion"],
          });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con los datos publicos del curso

          data = { curso, clases, valoraciones };
        } else {
          // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

          // obtengo el curso que se quiere consultar

          const curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: { instructor: true } });

          // busco las clases del curso que se quiere consultar

          const clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

          for (let i = 0; i < clases.length; i++) {
            const clase = clases[i];
            const clase_id = clase.id;
            const clase_finalizada = await strapi.db
              .query("api::clases-finalizada.clases-finalizada")
              .findOne({
                where: { clase: clase_id, usuario: user.id, curso: curso.id },
              });
            if (clase_finalizada) {
              clases[i].status = "finalizada";
            } else {
              clases[i].status = "no finalizada";
            }
          }

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };
        }
      } else if (user.role.type == "administrador") {
        // si es administrador le devulevo todos los datos del curso

        // obtengo el curso que se quiere consultar

        const curso = await strapi.db
          .query("api::curso.curso")
          .findOne({ where: { id }, populate: { instructor: true } });

        // busco las clases del curso que se quiere consultar

        const clases = await strapi.db
          .query("api::clase.clase")
          .findMany({ where: { curso: id } });

        // busco las valoraciones del curso que se quiere consultar

        const valoraciones = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findMany({ where: { curso: id } });

        // armo la respuesta con todos los datos del curso

        data = { curso, clases, valoraciones };

        // hago el return de la respuesta
      } else if (user.role.type == "instructor") {
        // verifico si el instructor es dueño del curso o es instructor de dicho curso

        const curso = await strapi.db.query("api::curso.curso").findOne({
          where: { id, instructor: user.id },
          populate: { instructor: true },
        });

        // si el instructor es dueño del curso o es instructor de dicho curso, envio todos los datos del curso

        if (curso) {
          // busco las clases del curso que se quiere consultar

          const clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };

          // hago el return de la respuesta
        } else {
          // verifico si tiene el curso en mis cursos

          const misCursos = await strapi.db
            .query("api::mis-curso.mis-curso")
            .findOne({ where: { curso: id, usuario: user.id } });

          // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

          if (!misCursos) {
            // obtengo el curso que se quiere consultar

            const curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: { instructor: true } });

            // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

            const clases = await strapi.db.query("api::clase.clase").findMany({
              where: { curso: id },
              select: ["nombre", "duracion", "descripcion"],
            });

            // busco las valoraciones del curso que se quiere consultar

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con los datos publicos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          } else {
            // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

            // obtengo el curso que se quiere consultar

            const curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: { instructor: true } });

            // busco las clases del curso que se quiere consultar

            const clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id } });

            //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

            for (let i = 0; i < clases.length; i++) {
              const clase = clases[i];
              const clase_id = clase.id;
              const clase_finalizada = await strapi.db
                .query("api::clases-finalizada.clases-finalizada")
                .findOne({
                  where: { clase: clase_id, usuario: user.id, curso: curso.id },
                });
              if (clase_finalizada) {
                clases[i].status = "finalizada";
              } else {
                clases[i].status = "no finalizada";
              }
            }

            // busco las valoraciones del curso que se quiere consultar

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con todos los datos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          }
        }
      }
    } else {
      // si no está logueado, envio solo datos publicos

      // obtengo el curso que se quiere consultar

      const curso = await strapi.db
        .query("api::curso.curso")
        .findOne({ where: { id }, populate: { instructor: true } });

      // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, duracion

      const clases = await strapi.db.query("api::clase.clase").findMany({
        where: { curso: id },
        select: ["nombre", "duracion", "descripcion"],
      });

      // busco las valoraciones del curso que se quiere consultar

      const valoraciones = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findMany({ where: { curso: id } });

      // armo la respuesta con los datos publicos del curso

      data = { curso, clases, valoraciones };
    }

    const meta = {};

    // some more custom logic
    meta.date = Date.now();

    // elimino el campo password, confirmationToken, resetPasswordToken,  del instructor si posee el campo isntructor

    if (data.curso.instructor) {
      delete data.curso.instructor.password;
      delete data.curso.instructor.confirmationToken;
      delete data.curso.instructor.resetPasswordToken;
    }

    delete data.curso.createdBy;

    delete data.curso.updatedBy;

    if (data.curso.subTitles) {
      data.curso.subTitles = JSON.parse(data.curso.subTitles);
    } else {
      data.curso.subTitles = [];
    }

    if (data.curso.whatYouWillLearn) {
      data.curso.whatYouWillLearn = JSON.parse(data.curso.whatYouWillLearn);
    } else {
      data.curso.whatYouWillLearn = [];
    }

    if (data.curso.requirements) {
      data.curso.requirements = JSON.parse(data.curso.requirements);
    } else {
      data.curso.requirements = [];
    }

    if (data.curso.additionalResources) {
      data.curso.additionalResources = JSON.parse(
        data.curso.additionalResources
      );
    } else {
      data.curso.additionalResources = [];
    }

    // para el campo data.curso.summary, necesito cantidad de clases (sus duraciones), cantidad de projects y si tiene project final

    // uso las clases en data.clases para obtener la cantidad de clases y sus duraciones

    data.clases.forEach((clase) => {
      // verifico no sea undefined

      if (data.curso.duracionTotal === undefined) {
        data.curso.duracionTotal = 0;
      }
      // sumo las duraciones de las clases conviertiendo a numero

      data.curso.duracionTotal += parseFloat(clase.duracion);
    });

    // busco los projects del curso

    const projects = await strapi.db
      .query("api::project.project")
      .findMany({ where: { curso: id }, populate: { media: true } });
    let cantidadProjects = 0;
    // cantidad de projects
    if (projects) {
      cantidadProjects = projects.length;
    }

    // recorro los projects para ver si tiene project final

    let projectFinal = false;

    projects.forEach((project) => {
      if (project.projectFinal) {
        projectFinal = true;
      }
    });

    data.curso.summary = [
      {
        cantidadClases: data.clases.length,
        duracionTotal: data.curso.duracionTotal,
        cantidadProjects,
        projectFinal,
        additionalResources: data.curso.additionalResources,
      },
    ];

    data.projects = projects;

    return { data, meta };
  },

  async findBySlug(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.db.query("api::curso.curso").findOne({
      where: { slug: slug },
      populate: true,
    });

    if (!entity) {
      return ctx.notFound();
    }

    // saco el id del curso

    const id = entity.id;

    const user = ctx.state.user;

    let clases = "";
    let curso = "";

    let data = {};

    // verifico si el usuario esta logueado o no

    if (user) {
      if (user.role.type != "administrador" && user.role.type != "instructor") {
        // verifico en la tabla mis cursos si el usuario que está haciendo la petición tiene el curso que se quiere consultar

        const misCursos = await strapi.db
          .query("api::mis-curso.mis-curso")
          .findOne({ where: { curso: id, usuario: user.id } });

        // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

        if (!misCursos) {
          // obtengo el curso que se quiere consultar

          curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: true });

          // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

          clases = await strapi.db.query("api::clase.clase").findMany({
            where: { curso: id },
            select: ["nombre", "duracion", "descripcion"],
          });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con los datos publicos del curso

          data = { curso, clases, valoraciones };
        } else {
          // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

          // obtengo el curso que se quiere consultar

          curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: true });

          // busco las clases del curso que se quiere consultar

          clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

          for (let i = 0; i < clases.length; i++) {
            const clase = clases[i];
            const clase_id = clase.id;
            const clase_finalizada = await strapi.db
              .query("api::clases-finalizada.clases-finalizada")
              .findOne({
                where: { clase: clase_id, usuario: user.id, curso: curso.id },
              });
            if (clase_finalizada) {
              clases[i].status = "finalizada";
            } else {
              clases[i].status = "no finalizada";
            }
          }

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };
        }
      } else if (user.role.type == "administrador") {
        // si es administrador le devulevo todos los datos del curso

        // obtengo el curso que se quiere consultar

        curso = await strapi.db
          .query("api::curso.curso")
          .findOne({ where: { id }, populate: true });

        // busco las clases del curso que se quiere consultar

        clases = await strapi.db
          .query("api::clase.clase")
          .findMany({ where: { curso: id } });

        // busco las valoraciones del curso que se quiere consultar

        const valoraciones = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findMany({ where: { curso: id } });

        // armo la respuesta con todos los datos del curso

        data = { curso, clases, valoraciones };

        // hago el return de la respuesta
      } else if (user.role.type == "instructor") {
        // verifico si el instructor es dueño del curso o es instructor de dicho curso

        curso = await strapi.db.query("api::curso.curso").findOne({
          where: { id, instructor: user.id },
          populate: true,
        });

        // si el instructor es dueño del curso o es instructor de dicho curso, envio todos los datos del curso

        if (curso) {
          // busco las clases del curso que se quiere consultar

          clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });

          // busco las valoraciones del curso que se quiere consultar

          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });

          // armo la respuesta con todos los datos del curso

          data = { curso, clases, valoraciones };

          // hago el return de la respuesta
        } else {
          // verifico si tiene el curso en mis cursos

          const misCursos = await strapi.db
            .query("api::mis-curso.mis-curso")
            .findOne({ where: { curso: id, usuario: user.id } });

          // si el usuario no es dueño del curso y no está inscrito en el curso, envio solo datos publicos

          if (!misCursos) {
            // obtengo el curso que se quiere consultar

            curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: true });

            // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, descripcion, fecha, hora, duracion

            clases = await strapi.db.query("api::clase.clase").findMany({
              where: { curso: id },
              select: ["nombre", "duracion", "descripcion"],
            });

            // busco las valoraciones del curso que se quiere consultar

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con los datos publicos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          } else {
            // si el usuario es dueño del curso o está inscrito en el curso, envio todos los datos del curso

            // obtengo el curso que se quiere consultar

            curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: true });

            // busco las clases del curso que se quiere consultar

            clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id } });

            //verfico las clases del curso que estan finalizada y envio un status de finalizada o no finalizada

            for (let i = 0; i < clases.length; i++) {
              const clase = clases[i];
              const clase_id = clase.id;
              const clase_finalizada = await strapi.db
                .query("api::clases-finalizada.clases-finalizada")
                .findOne({
                  where: { clase: clase_id, usuario: user.id, curso: curso.id },
                });
              if (clase_finalizada) {
                clases[i].status = "finalizada";
              } else {
                clases[i].status = "no finalizada";
              }
            }

            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });

            // armo la respuesta con todos los datos del curso

            data = { curso, clases, valoraciones };

            // hago el return de la respuesta
          }
        }
      }
    } else {
      // si no está logueado, envio solo datos publicos

      // obtengo el curso que se quiere consultar

      curso = await strapi.db
        .query("api::curso.curso")
        .findOne({ where: { id }, populate: true });

      // busco las clases del curso que se quiere consultar y muestro solo los siguientes campos de la tabla clase nombre, duracion

      clases = await strapi.db.query("api::clase.clase").findMany({
        where: { curso: id },
        select: ["nombre", "duracion", "descripcion"],
      });

      // busco las valoraciones del curso que se quiere consultar

      const valoraciones = await strapi.db
        .query("api::valoracion-curso.valoracion-curso")
        .findMany({ where: { curso: id } });

      // armo la respuesta con los datos publicos del curso

      data = { curso, clases, valoraciones };
    }

    const meta = {};

    // some more custom logic
    meta.date = Date.now();

    // elimino el campo password, confirmationToken, resetPasswordToken,  del instructor si posee el campo isntructor

    if (data.curso.instructor) {
      delete data.curso.instructor.password;
      delete data.curso.instructor.confirmationToken;
      delete data.curso.instructor.resetPasswordToken;
    }

    delete data.curso.createdBy;

    delete data.curso.updatedBy;

    if (data.curso.subTitles) {
      data.curso.subTitles = JSON.parse(data.curso.subTitles);
    } else {
      data.curso.subTitles = [];
    }

    if (data.curso.whatYouWillLearn) {
      data.curso.whatYouWillLearn = JSON.parse(data.curso.whatYouWillLearn);
    } else {
      data.curso.whatYouWillLearn = [];
    }

    if (data.curso.requirements) {
      data.curso.requirements = JSON.parse(data.curso.requirements);
    } else {
      data.curso.requirements = [];
    }

    if (data.curso.additionalResources) {
      data.curso.additionalResources = JSON.parse(
        data.curso.additionalResources
      );
    } else {
      data.curso.additionalResources = [];
    }

    // para el campo data.curso.summary, necesito cantidad de clases (sus duraciones), cantidad de projects y si tiene project final

    // uso las clases en data.clases para obtener la cantidad de clases y sus duraciones

    data.clases.forEach((clase) => {
      // verifico no sea undefined

      if (data.curso.duracionTotal === undefined) {
        data.curso.duracionTotal = 0;
      }
      // sumo las duraciones de las clases conviertiendo a numero

      data.curso.duracionTotal += parseFloat(clase.duracion);
    });

    //

    //verfico las clases del curso que contengan el campo additionalResources y cuento los recursos e inserto en el campo additionalResources del curso la cantidad de recursos
    // obtengo las clases del curso

    clases = await strapi.db
      .query("api::clase.clase")
      .findMany({ where: { curso: id } });

    let cantidadRecursos = 0;
    for (let i = 0; i < clases.length; i++) {
      const clase = clases[i];
      if (clase.additionalResources) {
        //convierto additionalResources que es un string a un array

        clase.additionalResources = JSON.parse(clase.additionalResources);
        cantidadRecursos += clase.additionalResources.length;
      }
    }
    data.curso.additionalResources = cantidadRecursos;
    console.log("curso", curso);

    // busco los projects del curso

    const projects = await strapi.db
      .query("api::project.project")
      .findMany({ where: { curso: id }, populate: { media: true } });
    let cantidadProjects = 0;
    // cantidad de projects
    if (projects) {
      cantidadProjects = projects.length;
    }

    // recorro los projects para ver si tiene project final

    let projectFinal = false;

    projects.forEach((project) => {
      if (project.projectFinal) {
        projectFinal = true;
      }
    });

    data.curso.summary = [
      {
        cantidadClases: data.clases.length,
        duracionTotal: data.curso.duracionTotal,
        cantidadProjects,
        projectFinal,
        additionalResources: data.curso.additionalResources,
      },
    ];

    data.projects = projects;

    return { data, meta };
  },

  async miStudent(ctx) {
    // recibo el slug

    const { slug } = ctx.params;

    // busco al profesor por el slug

    const instructor = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { slug: slug },
        select: ["id"],
      });

    if (!instructor) {
      return ctx.badRequest(null, "No se encontró el instructor");
    }

    // busco los cursos del instructor

    const cursos = await strapi.db.query("api::curso.curso").findMany({
      where: { instructor: instructor.id },

      select: ["id"],
    });

    if (!cursos) {
      return ctx.badRequest(null, "No se encontraron cursos");
    }

    // busco los estudiantes de los cursos del instructor

    const cursosComprados = await strapi.db
      .query("api::mis-curso.mis-curso")
      .findMany({
        where: {
          curso: {
            id: {
              $in: cursos.map((curso) => curso.id),
            },
          },
        },

        populate: true,
      });

    if (!cursosComprados) {
      return ctx.badRequest(null, "No se encontraron estudiantes");
    }

    // extraigo los estudiantes de los cursosComprados del instructor  evitando duplicados revisando por el id del usuario. El usuario se encuentra en cursosComprados.usuario

    const estudiantesUnicos = cursosComprados.reduce((acc, current) => {
      console.log(current);
      // si current.usuario no es null prosigo con el proceso , sino salto el proceso y sigo con el siguiente item del array

      if (!current.usuario) {
        return acc;
      }

      const x = acc.find((item) => item.id === current.usuario.id);

      if (!x) {
        return acc.concat([current.usuario]);
      } else {
        return acc;
      }
    }, []);

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findMany({
        where: {
          id: {
            $in: estudiantesUnicos.map((estudiante) => estudiante.id),
          },
        },

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

    entity.forEach((estudiante) => {
      arrayEliminar.forEach((element) => {
        delete estudiante[element];
      });
    });

    return { data: entity, meta: {} };
  },
}));

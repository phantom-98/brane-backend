"use strict";

/**
 * curso controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { v4 } = require('uuid')

module.exports = createCoreController("api::curso.curso", ({ strapi }) => ({
  // Method 2: Wrapping a core action (leaves core logic in place)
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: "en", populate: '*' };
    console.log("ctx.query", ctx.query);
    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // recorro los cursos y anexo el instructor
    //console.log("DATA", data);
    for (let i = 0; i < data.length; i++) {
      const curso = data[i];
      // console.log("CURSO", data[i]);
      curso.attributes.instructor = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          // uid syntax: 'api::api-name.content-type-name'
          where: {
            id: curso.attributes.instructor.data.id
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
    console.log("DATA");
    // some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },

  // modifico el update para que solo los cursos puedan ser actualizados por el usuario que lo creó y por el adminisrador

  async update(ctx) {
    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

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

    const { subTitles, whatYouWillLearn, requeriments, whoIsThisCourseFor } = ctx.request.body.data;


    if (subTitles) {
      // verifico sea un array  sino retorno un error
      if (!Array.isArray(subTitles)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo subtitulos debe ser un array",
        });
      }

      ctx.request.body.data.subTitles =  convertArrayToObjects(subTitles);
    }

    if (whatYouWillLearn) {
      if (!Array.isArray(whatYouWillLearn)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo que whatYouWillLearn debe ser un array",
        });
      }

      ctx.request.body.data.whatYouWillLearn =  convertArrayToObjects(whatYouWillLearn);
    }

    if (requeriments) {
      if (!Array.isArray(requeriments)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo requeriments debe ser un array",
        });
      }

      ctx.request.body.data.requeriments =  convertArrayToObjects(requeriments);
    }


    if (whoIsThisCourseFor) {
      if (!Array.isArray(whoIsThisCourseFor)) {
        return ctx.badRequest("Tipo de dato invalido", {
          error: "El campo whoIsThisCourseFor debe ser un array",
        });
      }

      ctx.request.body.data.whoIsThisCourseFor =  convertArrayToObjects(whoIsThisCourseFor);
    }

    let data = [];

    const { cupon_descuento } = ctx.request.body.data;

    if (cupon_descuento) {
      const cupon = await strapi.db
        .query("api::cupon.cupon")
        .findOne({ where: { slug: cupon_descuento }, populate: true });

      // si el cupom_descuento no existe en la tabla cupon no se puede asignar el cupom_descuento al curso

      if (!cupon) {
        return ctx.badRequest("El cupom no existe", {
          messages: [
            {
              id: "Curso.validation.cupom_descuento.required",
              message: "El cupom no existe",
            },
          ],
        },);
      }

      // si el cupom_descuento existe en la tabla cupon verifico el instructor del cupon

      // si el instructor del cupon es diferente al instructor del curso no se puede asignar el cupom_descuento al curso

      if (cupon.user.id != curso.instructor.id) {
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

      data = await super.update(ctx);

      let cursos_cupon = [id, ...cupon.cursos.map((curso) => curso.id)]

      await strapi.db
        .query("api::cupon.cupon")
        .update(
          {
            where: { slug: cupon_descuento },
            data: { cursos: cursos_cupon }
          }
        );
    } else {
      data = await super.update(ctx);
    }
    return data;
  },

  verificarConstraseña(codigo) {
    const regex = /^[a-zA-Z0-9@\-_.]{1,10}$/;
    return regex.test(codigo);
  },// modifico el delete para que solo los cursos puedan ser eliminados por el usuario que lo creó y por el adminisrador

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
    try {

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

      // extraigo los campos subTitles , whatYouWillLearn y requeriments

      const { subTitles, whatYouWillLearn, requeriments, whoIsThisCourseFor } = ctx.request.body.data;


      if (subTitles) {
        // verifico sea un array  sino retorno un error
        if (!Array.isArray(subTitles)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo subtitulos debe ser un array",
          });
        }

        ctx.request.body.data.subTitles =  convertArrayToObjects(subTitles);
      }

      if (whatYouWillLearn) {
        if (!Array.isArray(whatYouWillLearn)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo que whatYouWillLearn debe ser un array",
          });
        }

        ctx.request.body.data.whatYouWillLearn =  convertArrayToObjects(whatYouWillLearn);
      }

      if (requeriments) {
        if (!Array.isArray(requeriments)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo requeriments debe ser un array",
          });
        }

        ctx.request.body.data.requeriments =  convertArrayToObjects(requeriments);
      }


      if (whoIsThisCourseFor) {
        if (!Array.isArray(whoIsThisCourseFor)) {
          return ctx.badRequest("Tipo de dato invalido", {
            error: "El campo whoIsThisCourseFor debe ser un array",
          });
        }

        ctx.request.body.data.whoIsThisCourseFor =  convertArrayToObjects(whoIsThisCourseFor);

      }

      const userPopulate = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { id: user.id }, populate: true });


      //si el instructor tiene company asignado reviso si la company es un usuario de tipo institucion

      if (userPopulate.company) {
        const company = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({ where: { id: userPopulate.company.id }, populate: true });

        // si la company es de tipo institucion creo campos nuevo al curso: logo de la institucion y nombre de la institucion

        if (company.role.id == 6) {
          //console.log("hola")
          ctx.request.body.data.logo_institucion = company.avatar ? company.avatar.url : "";
          ctx.request.body.data.nombre_institucion = company.nombre;
        }
      }

      let data = [];

      const { cupon_descuento } = ctx.request.body.data;

      if (cupon_descuento) {
        const cupon = await strapi.db
          .query("api::cupon.cupon")
          .findOne({ where: { slug: cupon_descuento }, populate: true });
        // si el cupom_descuento no existe en la tabla cupon no se puede asignar el cupom_descuento al curso

        if (!cupon) {
          return ctx.badRequest("El cupom no existe", {
            messages: [
              {
                id: "Curso.validation.cupom_descuento.required",
                message: "El cupom no existe",
              },
            ],
          },);
        }

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

        data = await super.create(ctx);

        let cursos_cupon = [data.data.id, ...cupon.cursos.map((curso) => curso.id)]

        await strapi.db
          .query("api::cupon.cupon")
          .update(
            {
              where: { slug: cupon_descuento },
              data: { cursos: cursos_cupon }
            }
          );

      } else {
        // SI tipo = conferencia, creo la conferencia en zoom
        if (ctx.request.body.data.tipo == "conferencia") {

          if (!this.verificarConstraseña(ctx.request.body.data.password)) {
            return ctx.badRequest("La contraseña debe tener entre 1 y 10 caracteres y solo puede contener letras, números y los siguientes caracteres especiales @ - _ .", {
              error: "La contraseña debe tener entre 1 y 10 caracteres y solo puede contener letras, números y los siguientes caracteres especiales @ - _ ."
            });
          };

          const uuid = v4();

          let conference = {
            "MeetingID": uuid,
            "MeetingURL": process.env.URL_WEB + "/conference/" + uuid,
            "MeetingPassword": ctx.request.body.data.password,
            "MeetingStart": ctx.request.body.data.start,
            "MeetingDuration": ctx.request.body.data.duracion.toString(),
            "state": "scheduled",
            // "meetingRAW": JSON.stringify(response.data),
          }

          ctx.request.body.data.conference = conference;
        }
        data = await super.create(ctx);
      }

      return ctx.send(data);
    } catch (error) {
      console.log(error);
      
      return ctx.badRequest("Error al crear el curso", {
        ...error 
      });
    }
  },
  async registerMeeting(ctx) {

    try {

      let { user } = ctx.state;

      console.log("user", user)

      if (!user) {
        return ctx.unauthorized(`Not authorized`);
      }

      const { id } = ctx.params;

      if (!id) {
        return ctx.unauthorized(`Not id provided`);
      }

      const curso = await strapi.entityService.findOne("api::curso.curso", id, {
        populate: ["conference", "instructor"],
        fields: ["id", "tipo"]
      });

      console.log("curso", curso);

      if (!curso || curso.tipo != "conferencia" || !curso.conference) {
        return ctx.notFound(`Conference not found`);
      }

       const misCursos = await strapi.db
       .query("api::mis-curso.mis-curso")
       .findOne({ where: { curso: id, usuario: user.id } });
 
       console.log("misCursos",misCursos);
 
       if (!misCursos && user.id != curso.instructor.id && user.role.type != "administrador") {
         return ctx.unauthorized(`You can't create this entry`);
       }

       // verifico si el usuario es el instructor del curso

      return {
        role: user.id != curso.instructor.id ? "participante" : "instructor",
        userId: user.id,
        userName: user.nombre + " " + user.apellidos,
        userEmail: user.email,
        signature: signature,
        meetingNumber: curso.conference.MeetingID,
        meetingPassword: curso.conference.MeetingPassword,
        meetingTopic: curso.name,
        meetingStartTime: curso.conference.MeetingStart,
        meetingDuration: curso.conference.MeetingDuration,
        meetingTimeZone: curso.timezone,
     } ;

    } catch (error) {
      console.log(error);
    }
  },

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

    if (data.curso.requeriments) {
      data.curso.requeriments = JSON.parse(data.curso.requeriments);
    } else {
      data.curso.requeriments = [];
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
    try {
      const { slug } = ctx.params;
      const entity = await strapi.db.query("api::curso.curso").findOne({
        where: { slug: slug },
        populate: true,
      });

      console.log(entity)
      if (!entity) {
        console.log("curso no encontrado");
        return ctx.notFound("curso no encontrado", {
          error: "No existe curso con ese slug",
        });
      }
      const id = entity.id;
      const user = ctx.state.user;
      let clases = "";
      let curso = "";
      let data = {};
      if (user) {
        if (user.role.type != "administrador" && user.role.type != "instructor") {
          const misCursos = await strapi.db
            .query("api::mis-curso.mis-curso")
            .findOne({ where: { curso: id, usuario: user.id } });
          if (!misCursos) {
            curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: true });
            clases = await strapi.db.query("api::clase.clase").findMany({
              where: { curso: id },
              select: ["nombre", "duracion", "descripcion"],
            });
            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });
            data = { curso, clases, valoraciones };
          } else {
            curso = await strapi.db
              .query("api::curso.curso")
              .findOne({ where: { id }, populate: true });
            clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id } });
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
            data = { curso, clases, valoraciones };
          }
        } else if (user.role.type == "administrador") {
          curso = await strapi.db
            .query("api::curso.curso")
            .findOne({ where: { id }, populate: true });
          clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id } });
          const valoraciones = await strapi.db
            .query("api::valoracion-curso.valoracion-curso")
            .findMany({ where: { curso: id } });
          data = { curso, clases, valoraciones };
        } else if (user.role.type == "instructor") {
          curso = await strapi.db.query("api::curso.curso").findOne({
            where: { id, instructor: user.id },
            populate: true,
          });
          if (curso) {
            clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id } });
            const valoraciones = await strapi.db
              .query("api::valoracion-curso.valoracion-curso")
              .findMany({ where: { curso: id } });
            data = { curso, clases, valoraciones };
          } else {
            const misCursos = await strapi.db
              .query("api::mis-curso.mis-curso")
              .findOne({ where: { curso: id, usuario: user.id } });
            if (!misCursos) {
              curso = await strapi.db
                .query("api::curso.curso")
                .findOne({ where: { id }, populate: true });
              clases = await strapi.db.query("api::clase.clase").findMany({
                where: { curso: id },
                select: ["nombre", "duracion", "descripcion"],
              });
              const valoraciones = await strapi.db
                .query("api::valoracion-curso.valoracion-curso")
                .findMany({ where: { curso: id } });
              data = { curso, clases, valoraciones };
            } else {
              curso = await strapi.db
                .query("api::curso.curso")
                .findOne({ where: { id }, populate: true });
              clases = await strapi.db
                .query("api::clase.clase")
                .findMany({ where: { curso: id } });
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
              data = { curso, clases, valoraciones };
            }
          }
        }
      } else {
        curso = await strapi.db
          .query("api::curso.curso")
          .findOne({ where: { id }, populate: true });
        clases = await strapi.db.query("api::clase.clase").findMany({
          where: { curso: id },
          select: ["nombre", "duracion", "descripcion"],
        });
        const valoraciones = await strapi.db
          .query("api::valoracion-curso.valoracion-curso")
          .findMany({ where: { curso: id } });
        data = { curso, clases, valoraciones };
      }
      const meta = {};
      meta.date = Date.now();
      if (data.curso.instructor) {
        delete data.curso.instructor.password;
        delete data.curso.instructor.confirmationToken;
        delete data.curso.instructor.resetPasswordToken;
      }
      delete data.curso.createdBy;
      delete data.curso.updatedBy;
      if (data.curso.subTitles) {
        data.curso.subTitles = convertObjectsToArray(data.curso.subTitles);
      } else {
        data.curso.subTitles = [];
      }
      if (data.curso.whatYouWillLearn) {
        data.curso.whatYouWillLearn = convertObjectsToArray(
          data.curso.whatYouWillLearn
        );
      } else {
        data.curso.whatYouWillLearn = [];
      }
      if (data.curso.requeriments) {
        data.curso.requeriments = convertObjectsToArray(data.curso.requeriments);
      } else {
        data.curso.requeriments = [];
      }
      if (data.curso.additionalResources) {
        data.curso.additionalResources = convertObjectsToArray(
          data.curso.additionalResources
        );
      } else {
        data.curso.additionalResources = [];
      }

      if(data.curso.whoIsThisCourseFor){

        data.curso.whoIsThisCourseFor = convertObjectsToArray(
          data.curso.whoIsThisCourseFor
        );

      }

      data.curso.duracionTotal = data.clases.reduce(
        (total, clase) => total + parseFloat(clase.duracion),
        0
      );
      clases = await strapi.db.query("api::clase.clase").findMany({
        where: { curso: id },
      });
      let cantidadRecursos = 0;
      for (let i = 0; i < clases.length; i++) {
        const clase = clases[i];
        if (clase.additionalResources) {
          clase.additionalResources = convertObjectsToArray(clase.additionalResources);
          cantidadRecursos += clase.additionalResources.length;
        }
      }
      data.curso.additionalResources = cantidadRecursos;
      const projects = await strapi.db
        .query("api::project.project")
        .findMany({ where: { curso: id }, populate: { media: true } });
      let cantidadProjects = projects ? projects.length : 0;
      let projectFinal = projects.some((project) => project.projectFinal);
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
    } catch (error) {
       console.log(error)
       return ctx.badRequest("Ha ocurrido un error", ...error)
    }
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

  //modifico el controlador para editar la conferencia 
  async editMeeting(ctx) {

    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //verifico que el usuario este logueado  

    if (!user) {
      return ctx.unauthorized(`You can't edit this entry`);
    }

    //verifico que el usuario sea administrador o instructor

    if (user.role.type != "administrador" && user.role.type != "instructor") {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    // obtengo el id del curso que se quiere consultar

    const { id } = ctx.params;

    // consulto si el curso que se quiere consultar existe traigo solo id el titulo y el instructor

    const conferencia = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true, id: true, titulo: true },
    });

    // si el curso no existe, retorno error 404 not found

    if (!conferencia) {

      return ctx.notFound();

    }

    //verifico que el usuario sea el instructor del curso

    if (user.id != conferencia.instructor.id) {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    // busco la conferencia en zoom para actualizar en mi base de datos

    let conference = {
      //"MeetingPassword": response.data.password,
      "MeetingStart": ctx.request.body.data.fecha,
      "MeetingDuration": ctx.request.body.data.duracion,
      "state": "scheduled",
    }

    ctx.request.body.data.conference = conference;

    //retorno la conferencia editada en zoom 

    return ctx.send({ message: "Conferencia editada con éxito" });
  },

  async deleteMeeting(ctx) {

    // obtengo el usuario que está haciendo la petición

    const user = ctx.state.user;

    //verifico que el usuario este logueado  

    if (!user) {
      return ctx.unauthorized(`You can't edit this entry`);
    }

    //verifico que el usuario sea administrador o instructor

    if (user.role.type != "administrador" && user.role.type != "instructor") {

      return ctx.unauthorized(`You can't edit this entry`);

    }

    // obtengo el id del curso que se quiere consultar

    const { id } = ctx.params;

    // consulto si el curso que se quiere consultar existe traigo solo id el titulo y el instructor

    const conferencia = await strapi.db.query("api::curso.curso").findOne({
      // uid syntax: 'api::api-name.content-type-name'
      where: {
        id,
      },
      populate: { instructor: true, id: true, titulo: true },
    });

    // si el curso no existe, retorno error 404 not found

    if (!conferencia) {

      return ctx.notFound();

    }

    //verifico que el usuario sea el instructor del curso

    if (user.id != conferencia.instructor.id) {

      return ctx.unauthorized(`You can't edit this entry`);

    }
 
    //elimino el curso de la base de datos

    await strapi.db.query("api::curso.curso").delete({
      where: {
        id: id
      }
    })


    return ctx.send({ message: "Conferencia eliminada con éxito" });
  },
}));
function convertArrayToObjects(array) {
    // Mapea cada elemento del array a un objeto con la propiedad 'text'
    return array.map(item => ({ text: item }));
}

function convertObjectsToArray(objects) {
  // Mapea cada objeto del array extrayendo el valor de la propiedad 'text'
  return objects.map(obj => obj.text);
}
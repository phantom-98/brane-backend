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

    // recorro los cursos y anexo el profesor

    for (let i = 0; i < data.length; i++) {
      const curso = data[i];
      curso.profesor = await strapi.db.query("api::curso.curso").findOne({
        // uid syntax: 'api::api-name.content-type-name'
        where: {
          id: curso.id,
        },
        populate: { instructor: true },
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

    // si el usuario que está haciendo la petición es el instructor del curso o es administrador, puede actualizar el curso

    return await super.update(ctx);
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
     
    if (
      !ctx.request.body.data.instructor &&
      user.role.type != "instructor"
    ) {
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

    console.log(ctx.request.body.data);

    /* if (!ctx.request.body.instructor) {
      if (user.role.type == 'instructor') {
        ctx.request.body.instructor = user.id;
      } else {
        return ctx.unauthorized(`You can't create this entry`);
      }
    }*/

    // si el usuario que está haciendo la petición es instructor o es administrador, puede crear el curso

    return await super.create(ctx);
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
      select: ["id"]
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

          const clases = await strapi.db
            .query("api::clase.clase")
            .findMany({ where: { curso: id }, select: ["nombre", "duracion", "descripcion"] });

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

        const curso = await strapi.db
          .query("api::curso.curso")
          .findOne({
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

            const clases = await strapi.db
              .query("api::clase.clase")
              .findMany({ where: { curso: id }, select: ["nombre", "duracion", "descripcion"] });

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

      const clases = await strapi.db
        .query("api::clase.clase")
        .findMany({ where: { curso: id }, select: ["nombre", "duracion", "descripcion"] });

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


    return { data, meta };
  },
   
   async findBySlug(ctx) {
    const {slug} = ctx.params;
    console.log(ctx.params)
    const entity = await strapi.db.query("api::curso.curso").findOne({where: { slug: slug },
    populate: true });

    
    const sanitizedResults = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedResults);
  },
}));

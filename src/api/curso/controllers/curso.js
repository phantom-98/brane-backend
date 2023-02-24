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

    // verifico que el curso tiene el campo instructor lleno, sino  coloco el usuario que está haciendo la petición como instructor solo si es de tipo	instructor sino doy mensaje de error de validacion de campo instructor vacio y no se crea el curso

    if (!ctx.request.body.data.instructor && user.role.type == "instructor") {
      ctx.request.body.data.instructor = user.id;
    } else if (
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
}));

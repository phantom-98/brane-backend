const { sanitize } = require("@strapi/utils");

module.exports = (plugin) => {
  plugin.controllers.user.getBySlug = async (ctx) => {
    const { slug } = ctx.params;

    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { slug: slug },
        // populo todos los	campos de la tabla
        populate: true,
      });

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
    }

    // si hay usuario busco la meta_data del usuario

    const meta = await strapi.db
      .query("api::meta-usuario.meta-usuario")
      .findOne({
        where: { usuario: entity.id },
        // populo todos los	campos de la tabla
      });

    //añado la meta_data al usuario

    entity.metaData = meta;

    // elimino el password de la respuesta , updateBy y createBy

    let dataDelete = [
      "password",
      "updatedBy",
      "createdBy",
      "resetPasswordToken",
      "confirmationToken",
      "provider",
    ];

    // elimino los campos que no quiero que se muestren en la respuesta

    dataDelete.forEach((item) => {
      delete entity[item];
    });

    return entity;
  };

  //controlador para cambiar el rol de un usuario de estudiante a instructor
  plugin.controllers.user.roleInstructor = async (ctx) => {
    console.log("entro al controlador");
    //obtengo el id del usuario del token
    const id = ctx.state.user.id;

    console.log(id);

    //busco el usuario
    const entity = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: id },
        // populo todos los	campos de la tabla
        populate: true,
      });

    let = message = [];

    // si no hay usuario retorno un error 404

    if (!entity) {
      return ctx.notFound("No se encontró el usuario");
      message.push("No se encontró el usuario");
    }
    //obtengo el rol del usuario
    const role = entity.role.id;

    //si el usuario ya es instructor retorno un error 400

    if (entity.role.id == 3) {
      return ctx.badRequest("El usuario ya es instructor");
      message.push("El usuario ya es instructor");
    }

    //si el usuario no es estudiante retorno un error 400

    if (entity.role.id != 1) {
      return ctx.badRequest("El usuario no es estudiante");
      message.push("El usuario no es estudiante");
    }

    //actualizo el rol del usuario y le asigno el rol de instructor

    const entityActualizada = await strapi.db
      .query("plugin::users-permissions.user")
      .update({
        where: { id: id },
        data: {
          role: 3,
        },
      });

    console.log("Update", entityActualizada);
    //retorno el usuario actualizado

    return entityActualizada;
  };

  plugin.routes["content-api"].routes.push(
    {
      method: "GET",
      path: "/users/slug/:slug",
      handler: "user.getBySlug",
      config: {
        prefix: "",
      },
    },
    {
      method: "GET",
      path: "/users/roleInstructor/",
      handler: "user.roleInstructor",
    }
  );

  return plugin;
};
